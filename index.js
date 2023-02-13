const fs = require('fs')
const puppeteer = require('puppeteer-extra')
const Stealth = require('puppeteer-extra-plugin-stealth')
puppeteer.use(Stealth())

const [,, url, region] = process.argv
console.log(`Parsing [${region}] ${url}`)

// puppeteer.launch({ headless: true }).then(async browser => {
puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: false }).then(async browser => {
  const sleep = t => new Promise(r => setTimeout(r, t))

  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'domcontentloaded' })

  await page.waitForSelector("#__next")

  await page.evaluate(async region => {
    const sleep = t => new Promise(r => setTimeout(r, t))

    await sleep(5000)

    // Change region
    const regionSelector = document.querySelector('#__next > div > header > div > div > div')

    await sleep(5000)

    if (regionSelector) {
      console.log('current region:', regionSelector.innerText)
      regionSelector.click()
    }

    await sleep(5000)

    const regions = [...document.querySelectorAll('#__next > div > div > div > div > div > div > div')]
    console.log(regions.map(e => e.innerText))

    const reg = regions.find(e => e.innerText === region)
    if (reg) {
      console.log('found region:', reg.innerText)
      await sleep(5000)
      reg.click()
    }
  }, region)

  await sleep(5000)

  await page.waitForSelector("#__next")

  const results = await page.evaluate(async () => {
    const getFloatValue = e => parseFloat(e.replace(',', '.'))
    const sleep = t => new Promise(r => setTimeout(r, t))

    const data = {
      price: 0.0,
      priceOld: 0.0,
      reviews: 0,
      rating: 0
    }

    // await sleep(5000)

    // Get prices
    document.querySelectorAll('#product-page-buy-block > div:nth-child(3) > div > div > span')
      .forEach(e => {
        if (e.className.includes('Price_size_XL')) {
          data.price = getFloatValue(e.innerText)
          console.log('price:', data.price)
        }
        if (e.className.includes('Price_role_old')) {
          data.priceOld = getFloatValue(e.innerText)
          console.log('old price:', data.priceOld)
        }
      })

    await sleep(5000)

    // Get rating
    const ratingValue = document.querySelector('#__next > div > main > div:nth-child(3) > div > div > div > section > meta[itemprop=ratingCount]').content
    if (ratingValue) {
      data.rating = getFloatValue(ratingValue)
      console.log('rating:', data.rating)
    }

    await sleep(5000)

    // Get reviews
    const reviewsValue = document.querySelector('#__next > div > main > div:nth-child(3) > div > div > div > section > meta[itemprop=reviewCount]').content
    if (reviewsValue) {
      data.reviews = getFloatValue(reviewsValue)
      console.log('reviews:', data.reviews)
    }

    console.log('results are:', data)

    return JSON.stringify(data)
  })

  console.log('results are:', results)

  fs.writeFileSync('product.json', results)

  await sleep(5000)

  await page.screenshot({ path: 'screenshot.jpg', type: 'jpeg', fullPage: true })
  console.log('screenshot taken')

  await browser.close()
})
