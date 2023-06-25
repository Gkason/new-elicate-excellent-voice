import { OptionGroup } from "../core/options/option-group";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const openAIOptions: OptionGroup = {
  id: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  options: [
    {
      id: 'apiKey',
      displayOnSettingsScreen: 'user',
      displayAsSeparateSection: false,
      renderProps: () => ({
        type: 'password',
        label: 'Your OpenAI API Key',
        placeholder: 'sk-************************************************',
        description: <></>,
      }),
    },
  ],
};