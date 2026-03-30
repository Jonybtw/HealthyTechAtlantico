interface ProtocolReferenceRow {
  age: string;
  male: string;
  female: string;
}

interface ProtocolTestDefinition {
  testKey: string;
  unitKey: string;
  descKey: string;
  iconKey:
    | "wind"
    | "heart"
    | "timer"
    | "zap"
    | "activity"
    | "dumbbell"
    | "ruler";
}

export const BMI_TABLE: ProtocolReferenceRow[] = [
  { age: "9", male: "<=18.4", female: "<=18.7" },
  { age: "10", male: "<=19.4", female: "<=19.9" },
  { age: "11", male: "<=20.2", female: "<=20.7" },
  { age: "12", male: "<=21.0", female: "<=21.7" },
  { age: "13", male: "<=21.8", female: "<=22.6" },
  { age: "14", male: "<=22.6", female: "<=23.3" },
  { age: "15", male: "<=23.5", female: "<=24.0" },
  { age: "16", male: "<=24.2", female: "<=24.4" },
  { age: "17", male: "<=24.9", female: "<=24.7" },
  { age: "18", male: "<=25.0", female: "<=25.0" },
];

export const WAIST_TABLE: ProtocolReferenceRow[] = [
  { age: "9", male: "<=66.1", female: "<=62.6" },
  { age: "10", male: "<=68.0", female: "<=64.3" },
  { age: "11", male: "<=70.0", female: "<=66.5" },
  { age: "12", male: "<=72.2", female: "<=68.8" },
  { age: "13", male: "<=74.4", female: "<=70.4" },
  { age: "14", male: "<=76.3", female: "<=71.6" },
  { age: "15", male: "<=78.1", female: "<=72.6" },
  { age: "16", male: "<=80.0", female: "<=73.4" },
  { age: "17", male: "<=81.7", female: "<=74.0" },
  { age: "18", male: "<=83.2", female: "<=74.7" },
];

export const TEST_ZONE_KEYS: ProtocolTestDefinition[] = [
  {
    testKey: "testVaiVem",
    unitKey: "testVaiVemUnit",
    descKey: "testVaiVemDesc",
    iconKey: "wind",
  },
  {
    testKey: "testCooper",
    unitKey: "testCooperUnit",
    descKey: "testCooperDesc",
    iconKey: "heart",
  },
  {
    testKey: "testMilha",
    unitKey: "testMilhaUnit",
    descKey: "testMilhaDesc",
    iconKey: "timer",
  },
  {
    testKey: "testVelocidade",
    unitKey: "testVelocidadeUnit",
    descKey: "testVelocidadeDesc",
    iconKey: "zap",
  },
  {
    testKey: "testAgilidade",
    unitKey: "testAgilidadeUnit",
    descKey: "testAgilidadeDesc",
    iconKey: "activity",
  },
  {
    testKey: "testAbdominais",
    unitKey: "testAbdominaisUnit",
    descKey: "testAbdominaisDesc",
    iconKey: "dumbbell",
  },
  {
    testKey: "testExtensoes",
    unitKey: "testExtensoesUnit",
    descKey: "testExtensoesDesc",
    iconKey: "dumbbell",
  },
  {
    testKey: "testSentaAlcanca",
    unitKey: "testSentaAlcancaUnit",
    descKey: "testSentaAlcancaDesc",
    iconKey: "ruler",
  },
];
