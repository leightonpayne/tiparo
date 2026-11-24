export type AgitpropSource = {
  author: string;
  title: string;
  /** Year of writing or first publication, as identified by the linked edition. */
  year: string;
  url: string;
};

// Primary texts, archived editions and publisher excerpts used on the posters.
export const agitpropSources = {
  morris_beauty: {
    author: "William Morris",
    title: "The Beauty of Life",
    year: "1880",
    url: "https://www.marxists.org/archive/morris/works/1882/hopes/chapters/chapter3.htm",
  },
  morris_work: {
    author: "William Morris",
    title: "Useful Work versus Useless Toil",
    year: "1884",
    url: "https://www.marxists.org/archive/morris/works/1884/useful.htm",
  },
  morris_master: {
    author: "William Morris",
    title: "No Master",
    year: "1884",
    url: "https://morrisarchive.lib.uiowa.edu/items/show/628",
  },
  morris_labour: {
    author: "William Morris",
    title: "Art and Labour",
    year: "1884",
    url: "https://www.marxists.org/archive/morris/works/1884/art-lab.htm",
  },
  morris_arts: {
    author: "William Morris",
    title: "The Lesser Arts",
    year: "1877",
    url: "https://www.marxists.org/archive/morris/works/1882/hopes/chapters/chapter1.htm",
  },
  marx_hours: {
    author: "Karl Marx",
    title: "Instructions for the Delegates of the Provisional General Council",
    year: "1866",
    url: "https://www.marxists.org/archive/marx/works/1866/08/instructions.htm",
  },
  marx_time: {
    author: "Karl Marx",
    title: "Value, Price and Profit",
    year: "1865",
    url: "https://www.marxists.org/archive/marx/works/1865/value-price-profit/ch03.htm",
  },
  luxemburg_reform: {
    author: "Rosa Luxemburg",
    title: "Reform or Revolution / Introduction",
    year: "1899",
    url: "https://www.marxists.org/archive/luxemburg/1900/reform-revolution/intro.htm",
  },
  luxemburg_constitution: {
    author: "Rosa Luxemburg",
    title: "Reform or Revolution / Chapter VIII",
    year: "1899",
    url: "https://www.marxists.org/archive/luxemburg/1900/reform-revolution/ch08.htm",
  },
  marx_radical: {
    author: "Karl Marx",
    title: "Critique of Hegel’s Philosophy of Right / Introduction",
    year: "1844",
    url: "https://www.marxists.org/archive/marx/works/1844/df-jahrbucher/law-abs.htm",
  },
  luxemburg_society: {
    author: "Rosa Luxemburg",
    title: "The Socialisation of Society",
    year: "1918",
    url: "https://www.marxists.org/archive/luxemburg/1918/12/20.htm",
  },
  manifesto_two: {
    author: "Karl Marx & Friedrich Engels",
    title: "Manifesto of the Communist Party / II",
    year: "1848",
    url: "https://www.marxists.org/archive/marx/works/1848/communist-manifesto/ch02.htm",
  },
  connolly_earth: {
    author: "James Connolly",
    title: "We Only Want the Earth / Songs of Freedom",
    year: "1907",
    url: "https://www.marxists.org/archive/connolly/1907/xx/wewnerth.htm",
  },
  engels_housing: {
    author: "Friedrich Engels",
    title: "The Housing Question / Part I",
    year: "1872",
    url: "https://www.marxists.org/archive/marx/works/1872/housing-question/ch01.htm",
  },
  manifesto_one: {
    author: "Karl Marx & Friedrich Engels",
    title: "Manifesto of the Communist Party / I",
    year: "1848",
    url: "https://www.marxists.org/archive/marx/works/1848/communist-manifesto/ch01.htm",
  },
  marx_rules: {
    author: "Karl Marx",
    title: "General Rules of the International Working Men’s Association",
    year: "1871",
    url: "https://www.marxists.org/archive/marx/works/1871/10/24.htm",
  },
  lenin_state: {
    author: "V. I. Lenin",
    title: "The State and Revolution / V",
    year: "1917",
    url: "https://www.marxists.org/archive/lenin/works/1917/staterev/ch05.htm",
  },
  connolly_revolution: {
    author: "James Connolly",
    title: "Socialism Made Easy",
    year: "1909",
    url: "https://www.marxists.org/archive/connolly/1909/sme-la/sme2.htm",
  },
  manifesto_four: {
    author: "Karl Marx & Friedrich Engels",
    title: "Manifesto of the Communist Party / IV",
    year: "1848",
    url: "https://www.marxists.org/archive/marx/works/1848/communist-manifesto/ch04.htm",
  },
  combahee: {
    author: "Combahee River Collective",
    title: "The Combahee River Collective Statement",
    year: "1977",
    url: "https://lgbtqhistory.org/wp-content/uploads/2019/04/Combahee_River_Collective_Statement.pdf",
  },
  zetkin_fascism: {
    author: "Clara Zetkin",
    title: "The Struggle Against Fascism",
    year: "1923",
    url: "https://www.marxists.org/archive/zetkin/1923/06/struggle-against-fascism.html",
  },
  marx_aveling: {
    author: "Eleanor Marx & Edward Aveling",
    title: "The Woman Question",
    year: "1886",
    url: "https://www.marxists.org/archive/eleanor-marx/works/womanq.htm",
  },
  davis_shahidi: {
    author: "Angela Davis",
    title: "In Conversation with Yara Shahidi",
    year: "2020",
    url: "https://time.com/collections/the-new-american-revolution/5880933/angela-davis-yara-shahidi-blm-activism/",
  },
  hooks_feminism: {
    author: "bell hooks",
    title: "Feminism Is for Everybody",
    year: "2000",
    url: "https://www.plutobooks.com/product/feminism-is-for-everybody/",
  },
  federici_wages: {
    author: "Silvia Federici",
    title: "Wages Against Housework",
    year: "1975",
    url: "https://files.libcom.org/files/Federici-Silvia-Wages-Against-Housework.pdf",
  },
  feminism_99: {
    author: "Cinzia Arruzza · Tithi Bhattacharya · Nancy Fraser",
    title: "Feminism for the 99%",
    year: "2019",
    url: "https://www.versobooks.com/en-gb/blogs/news/4261-feminism-for-the-99",
  },
  kollontai_family: {
    author: "Alexandra Kollontai",
    title: "Communism and the Family",
    year: "1920",
    url: "https://www.marxists.org/archive/kollonta/1920/communism-family.htm",
  },
  luxemburg_freedom: {
    author: "Rosa Luxemburg",
    title: "The Russian Revolution / VI",
    year: "1918",
    url: "https://www.marxists.org/archive/luxemburg/1918/russian-revolution/ch06.htm",
  },
  kollontai_day: {
    author: "Alexandra Kollontai",
    title: "Women’s Day",
    year: "1913",
    url: "https://www.marxists.org/archive/kollonta/1913/womens-day.htm",
  },
  luxemburg_suffrage: {
    author: "Rosa Luxemburg",
    title: "Women’s Suffrage and Class Struggle",
    year: "1912",
    url: "https://www.marxists.org/archive/luxemburg/1912/05/12.htm",
  },
  jones_peace: {
    author: "Claudia Jones",
    title: "International Women’s Day and the Struggle for Peace",
    year: "1950",
    url: "https://liberationschool.org/claudia-jones-1950-iwd-speech/",
  },
  douglass_demand: {
    author: "Frederick Douglass",
    title: "West India Emancipation",
    year: "1857",
    url: "https://home.nps.gov/frdo/learn/historyculture/thoughts-for-all-time.htm",
  },
  dubois_strivings: {
    author: "W. E. B. Du Bois",
    title: "The Souls of Black Folk / Of Our Spiritual Strivings",
    year: "1903",
    url: "https://teachingamericanhistory.org/document/the-souls-of-black-folk-2/",
  },
  kropotkin_wellbeing: {
    author: "Peter Kropotkin",
    title: "The Conquest of Bread / II",
    year: "1892",
    url: "https://www.marxists.org/reference/archive/kropotkin-peter/1892/bread.htm",
  },
  wilde_disobedience: {
    author: "Oscar Wilde",
    title: "The Soul of Man under Socialism",
    year: "1891",
    url: "https://www.marxists.org/reference/archive/wilde-oscar/soul-man/",
  },
  morris_fellowship: {
    author: "William Morris",
    title: "A Dream of John Ball / IV",
    year: "1886–1887",
    url: "https://www.marxists.org/archive/morris/works/1886/johnball/johnball.htm",
  },
  iww_preamble: {
    author: "Industrial Workers of the World",
    title: "Preamble to the IWW Constitution",
    year: "1905",
    url: "https://archive.iww.org/about/official/StJohn/2/",
  },
  debs_solidarity: {
    author: "Eugene V. Debs",
    title: "Social Reform / Labor & Freedom",
    year: "1916",
    url: "https://www.marxists.org/archive/debs/works/1916/1916-socreform.htm",
  },
  goldman_breadth: {
    author: "Emma Goldman",
    title: "The Tragedy of Woman’s Emancipation",
    year: "1906",
    url: "https://www.marxists.org/reference/archive/goldman/works/1906/tragedy-women.htm",
  },
  wollstonecraft_power: {
    author: "Mary Wollstonecraft",
    title: "A Vindication of the Rights of Woman / IV",
    year: "1792",
    url: "https://www.marxists.org/reference/archive/wollstonecraft-mary/1792/vindication-rights-woman/ch04.htm",
  },
  decleyre_cooperation: {
    author: "Voltairine de Cleyre",
    title: "Direct Action",
    year: "1912",
    url: "https://theanarchistlibrary.org/library/voltairine-de-cleyre-direct-action",
  },
  zetkin_solidarity: {
    author: "Clara Zetkin",
    title: "Only in Conjunction With the Proletarian Woman Will Socialism Be Victorious",
    year: "1896",
    url: "https://www.marxists.org/archive/zetkin/1896/10/women.htm",
  },
  pankhurst_initiative: {
    author: "Sylvia Pankhurst",
    title: "Communism and its Tactics / Part Seven",
    year: "1922",
    url: "https://www.marxists.org/archive/pankhurst-sylvia/communism-tactics/ch07.htm",
  },
  parsons_intellect: {
    author: "Lucy Parsons",
    title: "Speech to the IWW",
    year: "1905",
    url: "https://www.lucyparsonsproject.com/writings/speech_to_iww.html",
  },
  cooper_voice: {
    author: "Anna Julia Cooper",
    title: "A Voice from the South / Woman versus the Indian",
    year: "1892",
    url: "https://nclhof.org/inductees/2024-2/anna-julia-cooper/",
  },
  wells_press: {
    author: "Ida B. Wells",
    title: "Southern Horrors / Self-Help",
    year: "1892",
    url: "https://www.gutenberg.org/cache/epub/14975/pg14975.txt",
  },
} satisfies Record<string, AgitpropSource>;
