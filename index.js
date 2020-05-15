const Boilerpipe = require('boilerpipe');
const puppeteer = require('puppeteer');
const fs = require('fs');

main = async () => {
  getData = async (browser, boilerpipe, article) => {
    return new Promise(async (resolve, reject) => {
      getHeader = (s) => {
        let head = s.split("<header class=\"entry-header\">")[1].split("</header>")[0];
        let linkToPoynter = head.split("href=\"")[1].split("\"")[0];
        head = head.split("<p class=\"entry-content__text\">");
        let factCheck = head[1].split("</p>")[0];
        let dateLocation = head[2].split("</p>")[0];
        dateLocation = dateLocation.split("<strong>")[1].split("</strong>")[0];
        return {linkToPoynter, factCheck, dateLocation};
      };
      getContentAndExplanation = (s) => {
        const art = s.split("<h1 class=\"entry-title\"")[1].split("</h1>")[0];
        let artHead = art.split("</span>")[1].trim();
        let truthValue = art.split("<span class=\"entry-title--red\">")[1].split(":</span>")[0];
        let exp = s.split("<p class=\"entry-content__text entry-content__text--explanation\">Explanation:")[1].split("</p>")[0].trim();
        let linkToArt = 'https://' + s.split("href=\"https://")[1].split("\"")[0];
        return {artHead, truthValue, exp, linkToArt};
      }
      const {linkToPoynter, factCheck, dateLocation} = getHeader(article);
      let page = await browser.newPage();
      await page.setDefaultNavigationTimeout(1200000);
      await page.goto(linkToPoynter);
      let con2 = await page.content();
      await page.goto('about:blank')
      await page.close();
      con2 = con2.split("<article")[1];
      const {artHead, truthValue, exp, linkToArt} = getContentAndExplanation(con2.split("</article>")[0]);
      let pageArt = await browser.newPage();
      await pageArt.setDefaultNavigationTimeout(1200000);
      await pageArt.goto(linkToArt);
      let artCon = await pageArt.content();
      await pageArt.goto('about:blank')
      await pageArt.close();
      boilerpipe.setHtml(artCon);
      boilerpipe.getText(function(err, articleContent) {
        if(err) {
          resolve({factCheck, dateLocation, artHead, truthValue, exp, linkToArt, linkToPoynter, articleContent: "Not Parseable"});
        }
        resolve({factCheck, dateLocation, artHead, truthValue, exp, linkToArt, linkToPoynter, articleContent});
      });
    });
  };
  const boilerpipe = new Boilerpipe({
    extractor: Boilerpipe.Extractor.Article
  });
  const browser = await puppeteer.launch();
  // for await( let i = 1; i < 60; i++ )
  for (let p = 61; p < 121; p++) {
    let data = [];
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(1200000); 
    await page.goto(`https://www.poynter.org/ifcn-covid-19-misinformation/page/${p}/`);
    con = await page.content();
    con = con.split("<article");
    for (let i = 1; i < con.length; i++) {
      console.log(`Page: ${p}, Article: ${i}`);
      data.push(await getData(browser, boilerpipe, con[i].split("</article>")[0]));
    }
    await page.goto('about:blank')
    await page.close();
    fs.writeFileSync(`./scrap/data${p}.json`, JSON.stringify(data));
  }
  await browser.close();
};


main();
