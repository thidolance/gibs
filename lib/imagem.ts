// Comprime uma imagem no navegador antes de salvar no Firebase: redimensiona para
// caber em `maxLado` px e exporta como JPEG, mantendo o data URL pequeno (~50–150 KB).

export async function comprimirImagem(arquivo: File, maxLado = 900, qualidade = 0.78): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(arquivo);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Imagem inválida."));
    el.src = dataUrl;
  });

  const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
  const largura = Math.round(img.width * escala);
  const altura = Math.round(img.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, largura, altura);
  return canvas.toDataURL("image/jpeg", qualidade);
}
