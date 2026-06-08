/** ヘルスチェック（dev.sh smoke / 監視用）。 */
export async function handleHealth(_req: Request): Promise<Response> {
  return Response.json({ status: 'ok', service: 'habit-stack' });
}

export default handleHealth;
