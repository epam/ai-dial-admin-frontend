// Temporary icons config
import { Icon } from '@/src/components/IconGallery/IconGallery';

const iconNames = [
  'Addon_Wolfram.svg',
  'Cohere.svg',
  'GPT-4-V.svg',
  'Gemini-Pro-Vision.svg',
  'Gemini.svg',
  'Imagen.svg',
  'Llama2.svg',
  'Llama3.svg',
  'Stable-Diffusion.svg',
  'ai21_j2.svg',
  'anthropic.svg',
  'awc.svg',
  'databricks.svg',
  'dolly.svg',
  'gpt3.svg',
  'gpt4.svg',
  'message-square-lines-alt.svg',
  'mistral_7.svg',
  'palm2.svg',
];

export const getIconsConfig = (images: string[] | null): Icon[] => {
  const config = images ?? iconNames;
  return config.map((image): Icon => {
    return {
      url: `${image}`,
      name: image.split('.')[0],
    };
  });
};
