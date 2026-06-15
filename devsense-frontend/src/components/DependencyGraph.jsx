import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function DependencyGraph({ dependencies }) {
  const svgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!dependencies || dependencies.packages.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 900;
    const height = 700;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background", "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)");

    // Create nodes with more variety
    const nodes = dependencies.packages.slice(0, 20).map((pkg) => ({
      id: pkg.name,
      group: pkg.type === 'production' ? 1 : 2,
      size: Math.random() * 15 + 15, // Random size for visual interest
      ...pkg
    }));

    // Create realistic dependency links
    const links = [];
    
    // Main package (first one) connects to several others
    for (let i = 1; i < Math.min(nodes.length, 6); i++) {
      links.push({
        source: nodes[0].id,
        target: nodes[i].id,
        strength: 1
      });
    }

    // Create interconnected web
    for (let i = 1; i < nodes.length; i++) {
      // Each package connects to 1-3 random others
      const numConnections = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numConnections; j++) {
        const targetIndex = Math.floor(Math.random() * nodes.length);
        if (targetIndex !== i && !links.some(l => 
          (l.source === nodes[i].id && l.target === nodes[targetIndex].id) ||
          (l.target === nodes[i].id && l.source === nodes[targetIndex].id)
        )) {
          links.push({
            source: nodes[i].id,
            target: nodes[targetIndex].id,
            strength: Math.random() * 0.5 + 0.5
          });
        }
      }
    }

    // Enhanced force simulation with stronger physics
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(d => 120 / d.strength)
        .strength(d => d.strength))
      .force("charge", d3.forceManyBody()
        .strength(-400)
        .distanceMax(300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide()
        .radius(d => d.size + 10)
        .strength(0.8))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .alphaDecay(0.01); // Slower decay for smoother movement

    // Add glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "glow");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Add links with gradient
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#4b5563")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", d => d.strength * 3)
      .style("pointer-events", "none");

    // Add node groups
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "grab")
      .call(drag(simulation));

    // Add outer glow circle
    node.append("circle")
      .attr("r", d => d.size + 5)
      .attr("fill", d => d.group === 1 ? "#3b82f620" : "#10b98120")
      .attr("filter", "url(#glow)");

    // Add main circle with gradient
    node.append("circle")
      .attr("r", d => d.size)
      .attr("fill", d => d.group === 1 ? "#3b82f6" : "#10b981")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))")
      .on("mouseenter", function(_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", d.size * 1.3)
          .attr("stroke-width", 3);
        
        setSelectedNode(d);
        
        // Highlight connected links
        link.style("stroke-opacity", l => 
          (l.source.id === d.id || l.target.id === d.id) ? 0.8 : 0.2
        ).style("stroke", l =>
          (l.source.id === d.id || l.target.id === d.id) ? "#60a5fa" : "#4b5563"
        );
      })
      .on("mouseleave", function(_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", d.size)
          .attr("stroke-width", 2);
        
        setSelectedNode(null);
        
        // Reset links
        link.style("stroke-opacity", 0.4)
          .style("stroke", "#4b5563");
      });

    // Add package icon/initial
    node.append("text")
      .text(d => d.name.charAt(0).toUpperCase())
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", d => d.size * 0.8)
      .attr("font-weight", "bold")
      .attr("fill", "#fff")
      .style("pointer-events", "none")
      .style("user-select", "none");

    // Add labels below nodes
    node.append("text")
      .text(d => d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name)
      .attr("x", 0)
      .attr("y", d => d.size + 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("fill", "#e5e7eb")
      .style("pointer-events", "none")
      .style("user-select", "none");

    // Add tooltips
    node.append("title")
      .text(d => `${d.name}\nVersion: ${d.version}\nType: ${d.type}\nConnections: ${links.filter(l => l.source.id === d.id || l.target.id === d.id).length}`);

    // Update positions on tick with smooth animation
    simulation.on("tick", () => {
      // Keep nodes within bounds with padding
      nodes.forEach(d => {
        d.x = Math.max(50, Math.min(width - 50, d.x));
        d.y = Math.max(50, Math.min(height - 50, d.y));
      });

      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Enhanced drag with physics
    function drag(simulation) {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d3.select(this).style("cursor", "grabbing");
        
        // Increase charge force when dragging for more dramatic effect
        simulation.force("charge").strength(-600);
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
        
        // Apply force to connected nodes for chain reaction
        links.forEach(link => {
          if (link.source.id === d.id) {
            const dx = event.x - link.target.x;
            const dy = event.y - link.target.y;
            link.target.vx += dx * 0.1;
            link.target.vy += dy * 0.1;
          } else if (link.target.id === d.id) {
            const dx = event.x - link.source.x;
            const dy = event.y - link.source.y;
            link.source.vx += dx * 0.1;
            link.source.vy += dy * 0.1;
          }
        });
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        d3.select(this).style("cursor", "grab");
        
        // Reset charge force
        simulation.force("charge").strength(-400);
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [dependencies]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-white">Interactive Dependency Graph</h3>
        <div className="text-sm text-gray-400">
          Drag nodes to explore connections
        </div>
      </div>
      
      <div className="relative">
        <svg ref={svgRef} className="rounded-lg shadow-inner"></svg>
        
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl max-w-xs">
            <div className="text-white font-semibold text-lg mb-2">{selectedNode.name}</div>
            <div className="space-y-1 text-sm">
              <div className="text-gray-300">
                <span className="text-gray-400">Version:</span> {selectedNode.version}
              </div>
              <div className="text-gray-300">
                <span className="text-gray-400">Type:</span>{' '}
                <span className={selectedNode.type === 'production' ? 'text-blue-400' : 'text-green-400'}>
                  {selectedNode.type}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex gap-6 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 shadow-lg"></div>
          <span className="text-gray-300 font-medium">Production Dependencies</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-green-500 shadow-lg"></div>
          <span className="text-gray-300 font-medium">Development Dependencies</span>
        </div>
      </div>
      
      <div className="mt-4 text-center text-xs text-gray-500">
        💡 Tip: Drag any node to see how dependencies are connected. Connected nodes will move together!
      </div>
    </div>
  );
}
