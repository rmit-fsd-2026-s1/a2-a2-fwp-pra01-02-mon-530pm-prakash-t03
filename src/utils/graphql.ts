const GRAPHQL_URL = 'http://localhost:5000/graphql';

export async function graphqlFetch<T = any>(query: string, variables: any = {}): Promise<T> {
  const token = localStorage.getItem('vv_token');
  
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    const body = await res.json();

    if (body.errors) {
      const errorMsg = body.errors[0]?.message || 'GraphQL Operation Error';
      throw new Error(errorMsg);
    }

    return body.data as T;
  } catch (err: any) {
    console.error('GraphQL request failure:', err);
    throw err;
  }
}
