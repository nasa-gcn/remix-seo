import { type ServerRouteManifest } from "@remix-run/server-runtime/routes";
import { generateSitemap } from "../src";

async function getUrls(response: Promise<Response>) {
  const text = await (await response).text();
  const urls: string[] = [];
  for (const [, url] of text.matchAll(/<loc>(.*)<\/loc>/g)) {
    urls.push(url);
  }
  return urls;
}

describe("generateSitemap", () => {
  const siteUrl = "http://example.com";
  const request = new Request(`${siteUrl}/sitemap.xml`);
  const options = { siteUrl };

  const routeProps = {
    index: undefined,
    caseSensitive: undefined,
    module: { default: () => "" },
  };

  it("does not add multiple slashes with remix-flat-routes", async () => {
    const routes: ServerRouteManifest = {
      root: {
        id: "root",
        parentId: undefined,
        path: "",
        ...routeProps,
      },
      "routes/_foobar+/_layout": {
        id: "routes/_foobar+/_layout",
        parentId: "root",
        path: undefined,
        ...routeProps,
      },
      "routes/_foobar+/bat": {
        id: "routes/_foobar+/bat",
        parentId: "routes/_foobar+/_layout",
        path: "bat",
        ...routeProps,
      },
    };
    const result = generateSitemap(request, routes, options);
    const urls = await getUrls(result);
    expect(urls).toStrictEqual(["http://example.com/bat"]);
  });

  it("supports multiple route paths", async () => {
    const routes: ServerRouteManifest = {
      root: {
        id: "root",
        parentId: undefined,
        path: "",
        ...routeProps,
      },
      "routes/_foobar+/_layout": {
        id: "routes/_foobar+/_layout",
        parentId: "root",
        path: undefined,
        ...routeProps,
      },
      "routes/_foobar+/bat": {
        id: "routes/_foobar+/bat",
        parentId: "routes/_foobar+/_layout",
        path: "bat",
        ...routeProps,
      },
      "routes/_foobar+/foo": {
        id: "routes/_foobar+/foo",
        parentId: "routes/_foobar+/bat",
        path: "foo",
        ...routeProps,
      },
    };
    const result = generateSitemap(request, routes, options);
    const urls = await getUrls(result);
    expect(urls).toStrictEqual(["http://example.com/bat", "http://example.com/bat/foo"]);
  });

  it("index", async () => {
    const routes: ServerRouteManifest = {
      root: {
        id: "root",
        parentId: undefined,
        path: "",
        ...routeProps,
      },
      "routes/_foobar+/_layout": {
        id: "routes/_foobar+/_layout",
        parentId: "root",
        path: undefined,
        ...routeProps,
      },
      "routes/_foobar+/bat": {
        id: "routes/_foobar+/bat",
        parentId: "routes/_foobar+/_layout",
        path: "",
        ...routeProps,
        index: true
      },
    };
    const result = generateSitemap(request, routes, options);
    const urls = await getUrls(result);
    expect(urls).toStrictEqual(["http://example.com"]);
  });
});
