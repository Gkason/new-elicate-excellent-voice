import { OptionGroup } from "../core/options/option-group";

export const openAIOptions: OptionGroup = {
    id: 'openai',
    options: [
        {
            id: 'apiKey',
            defaultValue: "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",
            displayOnSettingsScreen: "user",
            displayAsSeparateSection: true,
            renderProps: () => null, // Returns null instead of an object for rendering the input field
        },
    ],
};

