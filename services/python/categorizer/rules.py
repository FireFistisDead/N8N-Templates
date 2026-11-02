"""Ordered filename-keyword rules used when no definition matches."""

from __future__ import annotations

# Order matters: the first category whose keyword is present wins.
RULES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("Technical Infrastructure & DevOps", ("totp", "bitwarden", "auth", "security")),
    ("Data Processing & Analysis", (
        "process", "writebinaryfile", "readbinaryfile", "extractfromfile",
        "converttofile", "googlefirebasecloudfirestore", "supabase",
        "surveymonkey", "renamekeys", "readpdf", "wufoo", "splitinbatches",
        "airtop", "comparedatasets", "spreadsheetfile",
    )),
    ("Business Process Automation", (
        "noop", "code", "schedule", "filter", "splitout", "wait", "limit",
        "aggregate", "acuityscheduling", "eventbrite", "philipshue",
        "stickynote", "n8ntrainingcustomerdatastore", "n8n",
    )),
    ("Web Scraping & Data Extraction", ("webhook", "respondtowebhook", "http", "rssfeedread")),
    ("Data Processing & Analysis", ("form", "typeform", "jotform")),
    ("Cloud Storage & File Management", ("localfile", "filemaker")),
    ("Data Processing & Analysis", ("postgres", "mysql", "mongodb", "redis", "elasticsearch", "snowflake")),
    ("AI Agent Development", (
        "openai", "awstextract", "awsrekognition", "humanticai", "openthesaurus",
        "googletranslate", "summarize",
    )),
    ("E-commerce & Retail", ("woocommerce", "gumroad")),
    ("Social Media Management", ("facebook", "linkedin", "instagram")),
    ("Communication & Messaging", ("zendesk", "intercom", "drift", "pagerduty")),
    ("Data Processing & Analysis", ("googleanalytics", "segment", "mixpanel")),
    ("Technical Infrastructure & DevOps", (
        "git", "github", "gitlab", "travisci", "jenkins", "uptimerobot",
        "gsuiteadmin", "debughelper", "bitbucket",
    )),
    ("CRM & Sales", ("pipedrive", "hubspot", "salesforce", "copper", "orbit", "agilecrm")),
    ("Marketing & Advertising Automation", (
        "mailchimp", "convertkit", "sendgrid", "mailerlite", "lemlist", "sendy",
        "postmark", "mailgun",
    )),
    ("Project Management", (
        "asana", "mondaycom", "clickup", "trello", "notion", "toggl",
        "microsofttodo", "calendly", "jira",
    )),
    ("Communication & Messaging", (
        "slack", "telegram", "discord", "mattermost", "twilio", "emailreadimap",
        "teams", "gotowebinar",
    )),
    ("Cloud Storage & File Management", ("dropbox", "googledrive", "onedrive", "awss3", "googledocs")),
    ("Creative Design Automation", ("canva", "figma", "bannerbear", "editimage")),
    ("Creative Content & Video Automation", ("youtube", "vimeo", "storyblok", "strapi")),
    ("Financial & Accounting", ("stripe", "chargebee", "quickbooks", "harvest")),
    ("Web Scraping & Data Extraction", ("openweathermap", "nasa", "crypto", "coingecko")),
)


def categorize(token: str) -> str | None:
    """Return the category for one filename token."""
    lowered = token.lower()
    for category, keywords in RULES:
        if any(keyword in lowered for keyword in keywords):
            return category
    return None
