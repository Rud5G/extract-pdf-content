const pdfjs = require('pdfjs-dist/es5/build/pdf')
const _ = require("lodash")

const { exit } = require('node:process');

const path = require('path');
const fs = require('fs');



async function getPageContent(doc, pageNumber = 1) {
    const page = await doc.getPage(pageNumber) // if doc has many pages use doc.numPages to iterate and pass index to doc.getPage
    return await page.getTextContent();
}

async function getItems(src) {
    // Perform pre-processing
    const doc = await pdfjs.getDocument({url: src, verbosity: 0}).promise
    const content = await getPageContent(doc);

    return content.items
        .filter((item) => item.str.trim().length)
        .map((item) => item.str)
        .filter((item, i) => i > 7)
}


function processItems(items) {
    // save json or save csv or write to db
    return _.chunk(items, 6).
      reduce((
        records,
        [id, date, amount, description, reconciled, transaction_type]) => {
          records.push(
            { id, date, amount, description, reconciled, transaction_type })
          return records
      }, []);
}

function handleErrors(error) {
    // handle errors
    console.error('Error', error);
}

const directoryPath = path.join(__dirname, '..', '..', 'pdf', 'notas', '2023');

function outputItems (records, file = 'a file') {

    // file
    console.log(
      JSON.stringify({
          filename: file,
          records: records
      })
    );
}

//passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }


    // listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        //console.log(`${directoryPath}/${file}`);

        getItems(`${directoryPath}/${file}`)
            .then(processItems)
            .then((result) => outputItems(result, file))
            .catch(handleErrors)
            .finally(() => {
                exit(0);
            })

    });
});