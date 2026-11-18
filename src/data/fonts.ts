export const previewPresets = {
  large: "The bureaucracy is a circle from which no one can escape.",
  medium: "If we have chosen the position in life in which we can most of all work for mankind, no burdens can bow us down, because they are sacrifices for the benefit of all; then we shall experience no petty, limited, selfish joy, but our happiness will belong to millions, our deeds will live on quietly but perpetually at work, and over our ashes will be shed the hot tears of noble people.",
  small: "But in the measure that history moves forward, and with it the struggle of the proletariat assumes clearer outlines, they no longer need to seek science in their minds; they have only to take note of what is happening before their eyes and to become its mouthpiece. So long as they look for science and merely make systems, so long as they are at the beginning of the struggle, they see in poverty nothing but poverty, without seeing in it the revolutionary, subversive side, which will overthrow the old society. From this moment, science, which is a product of the historical movement, has associated itself consciously with it, has ceased to be doctrinaire and has become revolutionary.",
} as const;

type FontSpecimenRules = {
  forceLowercase?: boolean;
  supportedGlyphs?: string[];
  unsupportedGlyphs?: string[];
  punctuationReplacement?: string;
  note?: string;
};

export type FontEntry = {
  id: string;
  family: string;
  designer: string;
  designers: Array<{
    name: string;
    url?: string;
  }>;
  foundry: string;
  foundryUrl?: string;
  license: string;
  licenseUrl?: string;
  copyright?: string;
  faces: Array<{
    id: string;
    name: string;
    fontFamily: string;
    weight: string;
    style: "normal" | "italic";
  }>;
  previewFamily: string;
  links: {
    source?: string;
    official?: string;
    download?: string;
  };
  version?: string;
  specimen?: FontSpecimenRules;
};
