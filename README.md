# Neru 10DLC Batch Linker/Unliner

**Batch Linker:** [https://api-ap.vonage.com/v1/neru/i/neru-3b8791fd-neru-batch-url-dev/linker](https://api-ap.vonage.com/v1/neru/i/neru-3b8791fd-neru-batch-url-dev/linker)

**Batch Unlinker:** [https://api-ap.vonage.com/v1/neru/i/neru-3b8791fd-neru-batch-url-dev/unlinker](https://api-ap.vonage.com/v1/neru/i/neru-3b8791fd-neru-batch-url-dev/unlinker)


**Simple UI**
![enter image description here](https://raw.githubusercontent.com/nexmo-se/10dlc-batch-linker-unlinker/main/ui.png?token=GHSAT0AAAAAABT6ZODMHEJSYTJQEYLGLLZIYUBNXZQ)

Auth token is automatically calculated based on api key and secret, but can be overridden if needed.

API URL defaults to [https://api-eu.vonage.com/v1/10dlc/](https://api-eu.vonage.com/v1/10dlc/) but can be overridden as well

**Configuraion**
Configuration are via a ".env" file *(rename .env-sample to .env)*


.env Content:

    10DLC_API_URL=https://api-eu.vonage.com/v1/10dlc/
    SMTP_HOST=smtp-relay.sendinblue.com
    SMTP_USERNAME=
    SMTP_PASSWORD=
    SMTP_PORT=587
You can configure the emailer here and the default 10dlc API endpoint

**Input CSV Format**
The CSV format for the input is as follows

| number | brand_id | campaign_id |
| --|--|--|
| 1234567890 | BRD-123 | CMP-456 |

Note that the headers are required

**Output CSV Format**
Note that the process is asynchronous, so the CSV file will be mailed after the process
The CSV format for the outputis as follows
|number|brand_id|campaign_id|method|url|payload|result
|--|--|--|--|--|--|--|
|1234567890|BRD-123|CMP-456|POST|http://lookaddit.urzo.online/dump//brands/BRD-123/campaigns/CMP-456/numbers|{""country"":""US"",""number"":""1234567890""}|"{""args"":""ImmutableMultiDict([])"",""form"":""ImmutableMultiDict([])"",""headers"":""Content-Type: application/json\r\nContent-Length: 31\r\nX-Forwarded-For: 13.251.207.33, 172.70.143.81\r\nHost: lookaddit.urzo.online\r\nConnection: upgrade\r\nAccept-Encoding: gzip\r\nCf-Ipcountry: SG\r\nCf-Ray: 70adb05f28b546a9-SIN\r\nX-Forwarded-Proto: http\r\nCf-Visitor: {\""scheme\"":\""http\""}\r\nAccept: application/json, text/plain, */*\r\nAuthorization: Basic YXNkZmFzZjphc2RmYXNkZnNh\r\nUser-Agent: axios/0.27.2\r\nCf-Connecting-Ip: 13.251.207.33\r\nCdn-Loop: cloudflare\r\n\r\n"",""json"":""{'country': 'US', 'number': '1234567890'}"",""slug1"":""BRD-123"",""slug2"":""CMP-456""}"|

Note the result will show failures as well. Sample below:
|number|brand_id|campaign_id|method|url|payload|result
|--|--|--|--|--|--|--|
|11111111|111brand|111campaign|POST|https://api-eu.vonage.com/v1/10dlc//brands/111brand/campaigns/111brandcampaign/numbers|"{""country"":""US"",""number"":""11111111""}"|AxiosError: Request failed with status code 401|
