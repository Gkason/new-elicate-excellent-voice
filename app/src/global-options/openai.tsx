import { OptionGroup } from "../core/options/option-group";

export const openAIOptions: OptionGroup = {
    id: 'openai',
    options: [
        {
            id: 'apiKey',
            defaultValue: "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",
            displayOnSettingsScreen: "user",
            displayAsSeparateSection: false,
            renderProps: () => ({
                type: "password",
                label: "Your OpenAI API Key",
                placeholder: "sk-************************************************",
            }),
        },
    ],
}