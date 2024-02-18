const pdfjs = require('pdfjs-dist/es5/build/pdf')
const _ = require("lodash")

const path = require('path');
const fs = require('fs');
const { exit } = require('node:process');


async function getContent(src) {
    // console.log('src', typeof src);
    // exit(0);

    const doc = await pdfjs.getDocument({url: src, verbosity: 0}).promise


    const docBlob = {
        metadata: null,
        pages: []
    }
    docBlob.metadata = await doc.getMetadata()

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const pageBlob = {}
        pageBlob.viewport = page.getViewport({ scale: 1.0 })
        pageBlob.items = []

        const textContent = await page.getTextContent()
        for (const item of textContent.items) {
            // Set some convenience properties
            item.x1 = item.transform[4]
            item.x2 = item.x1 + item.width
            item.y1 = item.transform[5]
            item.y2 = item.y1 + item.height

            pageBlob.items.push(item)
        }

        docBlob.pages.push(pageBlob)
    }

    return docBlob;


    // if doc has many pages use doc.numPages to iterate and pass index to doc.getPage
    // const page = await doc.getPage(1)

    // return await page.getTextContent()
}

async function getItems(src) {
    // Perform pre-processing
    const content = await getContent(src);
    // console.log(content.items)

    // docBlob

    console.log(
    require('util').inspect(content, { depth: null })
    );

    exit(0);

    return content.items
        .filter((item) => item.str.trim().length)
        .map((item) => item.str)
        .filter((item, i) => i > 7)
}


function processItems(items) {
    const records = _.chunk(items, 6)
        .reduce((records, [id, date, amount, description, reconciled, transaction_type]) => {
            records.push({ id, date, amount, description, reconciled, transaction_type })
            return records
        }, [])

    // save json or save csv or write to db
    console.log(records)
}

function handleErrors(error) {
    // handle errors
    console.error('handleError', error);
}

const directoryPath = path.join(__dirname, '..', '..', 'pdf', 'notas', '2023');


fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    // listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        // console.log(`${directoryPath}/${file}`);

        getItems(`${directoryPath}/${file}`)
            .then(processItems)
            .catch(handleErrors)
            .finally(() => {
                exit(0);
            })
    });
});