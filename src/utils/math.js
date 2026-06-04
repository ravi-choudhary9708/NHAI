export const l2Normalize = (vec) => {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
};

export const cosineDistance = (a, b) => {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  return 1 - dot;
};

export const averageEmbeddings = (embeddings) => {
  const len = embeddings[0].length;
  const avg = new Array(len).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < len; i++) avg[i] += emb[i];
  }
  for (let i = 0; i < len; i++) avg[i] /= embeddings.length;
  return l2Normalize(avg);
};
