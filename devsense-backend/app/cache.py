QUERY_CACHE = {}


def get_cached(query: str):
    return QUERY_CACHE.get(query)


def set_cache(query: str, response: str):
    QUERY_CACHE[query] = response