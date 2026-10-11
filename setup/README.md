# Connecting the questionnaire to a Google Sheet

The questionnaire (`index.html`) works without this, but until it's connected, "Send" just downloads a text file. These steps make answers land in a Google Sheet in your own Google account. It takes about 5 minutes.

Use your **personal** Google account (not AMC).

1. Go to https://sheets.new and name the sheet "Derryn website questionnaire".
2. In the sheet, open **Extensions > Apps Script**.
3. Delete the sample code, paste in everything from `setup/Code.gs`, and click **Save**.
4. Click **Deploy > New deployment**. Click the gear icon and choose **Web app**.
   - Description: `questionnaire`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, then **Authorize access** and allow it. Google may show "Google hasn't verified this app". Click **Advanced > Go to (project name)**. This is normal for your own scripts.
6. Copy the **Web app URL** (it ends in `/exec`).
7. In `index.html`, set `var ENDPOINT = '<that URL>';`, then commit and push.

## What you get

- **Responses** tab: one row per submission, one column per question.
- **Answers (date)** tab: an easy-to-read list of every question and answer for each submission.
- **Uploads** tab, plus a Drive folder "Derryn website uploads" next to the sheet, holding any files she uploads.
- An email to you each time she sends it.

## Notes

- Answers also save in her browser as she goes, so she can stop and carry on later on the same device. Uploaded files aren't saved between visits. She adds them just before sending.
- If you change `Code.gs` later, use **Deploy > Manage deployments > Edit > New version** so the URL stays the same.
- The web app URL is public, but it only accepts submissions. Nobody can read the sheet through it.
