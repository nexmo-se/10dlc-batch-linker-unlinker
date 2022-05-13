import { neru } from 'neru-alpha';
import fs from "fs"
// import hpm from 'http-proxy-middleware';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
// import parsePhoneNumber from 'libphonenumber-js'
// import isoCountry from "i18n-iso-countries";
import cons from 'consolidate';
import 'dotenv/config'
import multer from 'multer';
import csv from 'fast-csv';
import axios from 'axios';

//create mailer
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    host: process.env['SMTP_HOST'],
    port: process.env['SMTP_PORT'],
    auth: {
        user: process.env['SMTP_USERNAME'],
        pass: process.env['SMTP_PASSWORD']
    },
});

const upload = multer({
    dest: 'tmp/csv/', limits: {
        fieldNameSize: 300,
        fileSize: 1048576, // 10 Mb
    }
});
const __dirname = dirname(fileURLToPath(import.meta.url));
var path = __dirname + '/views/';
// const { createProxyMiddleware, fixRequestBody, Filter, Options, RequestHandler } = hpm;

const debug = process.env.DEBUG;
console.log(process.env)
if (debug) {
    const private_key = process.env['PRIVATE_KEY']
} else {
    const private_key = "<PASTE PRIVATE_KEY HERE"
}

//You actually don't need neru router, just use your own
//const router = neru.Router()
const router = express.Router()
neru.bridge.api_key

// use bodyParser if not using neru
// You can leave this here even if using neru. neru will declare this when loading it's own Express
import bodyParser from 'body-parser';
router.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

function mailer(from, to, subject, message, attachment, attachment_name) {
    console.log(">>>", to, from, subject)
    transporter.sendMail(
        {
            from: from,
            to: to,
            subject: subject,
            text: message,
            html: message,
            //here is the magic
            attachments: [
                {
                    filename: attachment_name,
                    content: attachment,
                },
            ],
        },
        (err, info) => {
            if (err) {
                console.log("Error occurred. " + err.message);
                return process.exit(1);
            }
            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
    );
}

/*>>>> IF Standalone: use standalone redis *****/

// import { createClient } from 'redis';
// const instanceState = createClient();

// instanceState.on('error', (err) => console.log('Redis Client Error', err));

// await instanceState.connect();


//load the css, js, fonts to static paths so it's easier to call in template
router.use("/fonts", express.static(join(__dirname, "node_modules/bootstrap/fonts")));
router.use("/css", express.static(join(__dirname, "node_modules/bootstrap/dist/css")));
router.use("/js", express.static(join(__dirname, "node_modules/bootstrap/dist/js")));
router.use("/js", express.static(join(__dirname, "node_modules/jquery/dist")));
router.use("/csv/", express.static(join(__dirname, "tmp/download")));


//see if service is live
router.get('/', async (req, res, next) => {
    res.send("Vonage Proxy Service");
});


//Batch Linker
router.post('/batch-link', upload.single('csv_upload'), async (req, res, next) => {

    const _url = req.body["url-endpoint"]
    const authToken = req.body["auth-token"];
    const email = req.body["email"];
    const promises = []
    const send_request = (data) => {
        var _10dlc_url = _url + `/brands/${data["brand_id"]}/campaigns/${data["campaign_id"]}/numbers`
        var row_data = {
            success: true,
            number: data["number"],
            brand_id: data["brand_id"],
            campaign_id: data["campaign_id"],
            method: "POST",
            url: _10dlc_url,
            payload: null,
            data:null
        }
        
        var payload = {
            country: 'US',
            number: data["number"]
        }
        return axios({
            method: 'post',
            url: _10dlc_url,
            data: payload,
            headers: {
                'Authorization': `Basic ${authToken}`
            }
        }).then(function (response) {
            row_data["payload"]=JSON.stringify(payload)
            row_data["data"]=response.data
            return row_data
        }).catch(function (error) {
            row_data["payload"]=JSON.stringify(payload)
            row_data["data"]=error
            return row_data
        });
    }
    await csv.parseFile(req.file.path, { headers: true })
        .on("data", function (data) {
            promises.push(send_request(data));
        })
        .on("end", async function () {
            fs.unlinkSync(req.file.path);   // remove temp file
            handle(promises, email, req.file.filename)
        })

    const handle = (promises, email, url) => {
        Promise.all(promises).then(async (data) => {
            var strData = 'number,brand_id,campaign_id,method,url,payload,result\n'

            for await (const dat of data.map(entry =>
                csv.writeToString([[
                    entry["number"],
                    entry["brand_id"],
                    entry["campaign_id"],
                    entry["method"],
                    entry["url"],
                    entry["payload"],
                    entry["data"]
                ]])
            )) {
                strData += dat + "\n"
            }
            mailer("voange_mailer@gmail.com", email, "10DLC Batch Linker Results", "<html><body><h1>Attached is the batch linking Results</h1></body></html>", strData, "linker_result.csv")
        })
    }

    res.status(200).send("CSV Result will be sent to your email")
})

router.post('/batch-unlink', upload.single('csv_upload'), async (req, res, next) => {

    const _url = req.body["url-endpoint"]
    const authToken = req.body["auth-token"];
    const email = req.body["email"];
    const promises = []
    const send_request = (data) => {
        var _10dlc_url = _url + `/brands/${data["brand_id"]}/campaigns/${data["campaign_id"]}/numbers/${data["number"]}`
        var row_data = {
            success: true,
            number: data["number"],
            brand_id: data["brand_id"],
            campaign_id: data["campaign_id"],
            method: "DELETE",
            url: _10dlc_url,
            payload: null,
            data:null
        }
        
        var payload = {
        }
        return axios({
            method: 'delete',
            url: _10dlc_url,
            data: payload,
            headers: {
                'Authorization': `Basic ${authToken}`
            }
        }).then(function (response) {
            row_data["payload"]=JSON.stringify(payload)
            row_data["data"]=response.data
            return row_data
        }).catch(function (error) {
            row_data["payload"]=JSON.stringify(payload)
            row_data["data"]=error
            return row_data
        });
    }
    await csv.parseFile(req.file.path, { headers: true })
        .on("data", function (data) {
            promises.push(send_request(data));
        })
        .on("end", async function () {
            fs.unlinkSync(req.file.path);   // remove temp file
            handle(promises, email, req.file.filename)
        })

    const handle = (promises, email, url) => {
        Promise.all(promises).then(async (data) => {
            var strData = 'number,brand_id,campaign_id,method,url,payload,result\n'

            for await (const dat of data.map(entry =>
                csv.writeToString([[
                    entry["number"],
                    entry["brand_id"],
                    entry["campaign_id"],
                    entry["method"],
                    entry["url"],
                    entry["payload"],
                    entry["data"]
                ]])
            )) {
                strData += dat + "\n"
            }
            mailer("voange_mailer@gmail.com", email, "10DLC Batch UN-Linker Results", "<html><body><h1>Attached is the batch Un-linking Results</h1></body></html>", strData, "unlinker_result.csv")
        })
    }

    res.status(200).send("CSV Result will be sent to your email")
})

router.get('/linker', async (req, res, next) => {
    var fullUrl = req.protocol + '://' + req.get('host')
    console.log(fullUrl)

    cons.ejs(path + "linker_upload_csv.ejs", { default_url: process.env['10DLC_API_URL'] }, function (err, html) {
        if (err) throw err;
        res.send(html);
    });
});

router.get('/unlinker', async (req, res, next) => {
    var fullUrl = req.protocol + '://' + req.get('host')
    console.log(fullUrl)

    cons.ejs(path + "unlinker_upload_csv.ejs", { default_url: process.env['10DLC_API_URL'] }, function (err, html) {
        if (err) throw err;
        res.send(html);
    });
});




/*>>>> IF STANDALONE: Use Own Express ******/

// const app = express()
// const port = 3001
// console.log(process.env)
// app.use(router)
// app.listen(port, () => {
//     console.log(`App listening on port ${port}`)
// })

/*<<<< ENDIF Standalone *****/

router.use('/upload-csv', router);
/*>>>> IF NERU: use Neru's Express *****/

export { router };

/*<<<< ENDIF NERU *****/