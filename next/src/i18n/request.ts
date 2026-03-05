import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "pt"; // default locale — can be expanded to detect from cookies/headers
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
