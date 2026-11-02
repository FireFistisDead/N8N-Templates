"""Node -> service (integration) detection and trigger classification."""

from __future__ import annotations

import re
from typing import Any, Iterable

_SPECIAL_CHARS = re.compile(r"[^a-z0-9]")


def normalize(value: str) -> str:
    return _SPECIAL_CHARS.sub("", value.lower())


# Display names keyed by the normalised node suffix. Keys are lower-case so
# camelCase node types such as ``httpRequest`` actually match.
_SERVICE_NAMES: dict[str, str] = {
    # Messaging
    "telegram": "Telegram",
    "discord": "Discord",
    "slack": "Slack",
    "whatsapp": "WhatsApp",
    "mattermost": "Mattermost",
    "teams": "Microsoft Teams",
    "microsoftteams": "Microsoft Teams",
    "rocketchat": "Rocket.Chat",
    "twilio": "Twilio",
    # Email
    "gmail": "Gmail",
    "mailjet": "Mailjet",
    "emailreadimap": "Email (IMAP)",
    "emailsendsmtp": "Email (SMTP)",
    "emailsend": "Email (SMTP)",
    "outlook": "Outlook",
    "microsoftoutlook": "Outlook",
    # Cloud storage
    "googledrive": "Google Drive",
    "googledocs": "Google Docs",
    "googlesheets": "Google Sheets",
    "googleslides": "Google Slides",
    "dropbox": "Dropbox",
    "onedrive": "OneDrive",
    "box": "Box",
    "awss3": "AWS S3",
    "s3": "AWS S3",
    # Databases
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "airtable": "Airtable",
    "notion": "Notion",
    "supabase": "Supabase",
    "snowflake": "Snowflake",
    "elasticsearch": "Elasticsearch",
    "googlebigquery": "Google BigQuery",
    "cratedb": "CrateDB",
    "questdb": "QuestDB",
    "timescaledb": "TimescaleDB",
    # Project management
    "jira": "Jira",
    "github": "GitHub",
    "gitlab": "GitLab",
    "trello": "Trello",
    "asana": "Asana",
    "mondaycom": "Monday.com",
    "clickup": "ClickUp",
    "linear": "Linear",
    # AI / ML
    "openai": "OpenAI",
    "anthropic": "Anthropic",
    "huggingface": "Hugging Face",
    "googlegemini": "Google Gemini",
    # Social
    "linkedin": "LinkedIn",
    "twitter": "Twitter/X",
    "facebook": "Facebook",
    "instagram": "Instagram",
    "youtube": "YouTube",
    # Commerce & finance
    "shopify": "Shopify",
    "stripe": "Stripe",
    "paypal": "PayPal",
    "woocommerce": "WooCommerce",
    "gumroad": "Gumroad",
    "chargebee": "Chargebee",
    # Analytics
    "googleanalytics": "Google Analytics",
    "mixpanel": "Mixpanel",
    "segment": "Segment",
    # Calendar & tasks
    "googlecalendar": "Google Calendar",
    "googletasks": "Google Tasks",
    "cal": "Cal.com",
    "calendly": "Calendly",
    # Forms
    "typeform": "Typeform",
    "googleforms": "Google Forms",
    "form": "Form Trigger",
    "formtrigger": "Form Trigger",
    # Development / transport
    "webhook": "Webhook",
    "httprequest": "HTTP Request",
    "http": "HTTP Request",
    "graphql": "GraphQL",
    "sse": "Server-Sent Events",
    "mqtt": "MQTT",
    "kafka": "Kafka",
    "rabbitmq": "RabbitMQ",
    "amqp": "AMQP",
    "ftp": "FTP",
    # CRM & support
    "hubspot": "HubSpot",
    "salesforce": "Salesforce",
    "pipedrive": "Pipedrive",
    "copper": "Copper",
    "zendesk": "Zendesk",
    "intercom": "Intercom",
    "pagerduty": "PagerDuty",
    "freshdesk": "Freshdesk",
    # Marketing
    "mailchimp": "Mailchimp",
    "sendgrid": "SendGrid",
    "mailerlite": "MailerLite",
    "convertkit": "ConvertKit",
    "mailgun": "Mailgun",
    "postmark": "Postmark",
    # Files & docs
    "filemaker": "FileMaker",
    "googlecloudnaturallanguage": "Google Cloud Natural Language",
    "awstextract": "AWS Textract",
    "awsrekognition": "AWS Rekognition",
    # Creative
    "figma": "Figma",
    "canva": "Canva",
    "bannerbear": "Bannerbear",
    # LangChain
    "openai": "OpenAI",
    "chainllm": "LangChain",
    "agent": "LangChain",
    "langchain": "LangChain",
    "embeddings": "LangChain",
    "vectorstore": "LangChain",
}

# Nodes that are plumbing rather than integrations.
_UTILITY_NODES: set[str] = {
    "set", "function", "functionitem", "code", "if", "switch", "merge",
    "split", "splitout", "splitinbatches", "stickynote", "wait", "schedule",
    "cron", "manual", "stopanderror", "noop", "error", "limit", "aggregate",
    "summarize", "filter", "sort", "removeduplicates", "datetime",
    "extractfromfile", "converttofile", "readbinaryfile", "readbinaryfiles",
    "writebinaryfile", "executiondata", "executeworkflow", "executecommand",
    "respondtowebhook", "compareDatasets".lower(), "htmlextract", "markdown",
    "xml", "compression", "itemlists", "start", "n8n", "n8ntrainingcustomermessenger",
    "n8ntrainingcustomerdatastore", "debughelper", "spreadsheetfile",
    "localfile", "movebinarydata", "editimage", "readpdf", "awssqs",
}

_CANONICAL_UTILITY = {normalize(name) for name in _UTILITY_NODES}


def _candidate_suffixes(node_type: str) -> list[str]:
    """Return plausible service suffixes for an n8n node type."""
    node_type = node_type.strip()
    if not node_type:
        return []
    if node_type.startswith("n8n-nodes-base."):
        return [node_type.split(".", 1)[1]]
    if node_type.startswith("@n8n/"):
        return [node_type.rsplit(".", 1)[-1]]
    if "." in node_type:
        return [node_type.rsplit(".", 1)[-1]]
    return [node_type]


def _lookup(normalized: str) -> str | None:
    if not normalized:
        return None
    if normalized in _CANONICAL_UTILITY:
        return None
    if normalized in _SERVICE_NAMES:
        return _SERVICE_NAMES[normalized]

    # Handle plural / trigger suffixes: telegramTrigger -> telegram.
    for suffix in ("trigger", "tool", "node"):
        if normalized.endswith(suffix) and len(normalized) > len(suffix):
            stripped = normalized[: -len(suffix)]
            if stripped in _SERVICE_NAMES:
                return _SERVICE_NAMES[stripped]
            if stripped in _CANONICAL_UTILITY:
                return None
    return None


def extract_integrations(nodes: Iterable[dict[str, Any]]) -> set[str]:
    """Return the set of human-readable integrations used by a workflow."""
    integrations: set[str] = set()

    for node in nodes:
        node_type = str(node.get("type", ""))
        node_name = str(node.get("name", ""))
        normalized_type = normalize(node_type)

        for suffix in _candidate_suffixes(node_type):
            display = _lookup(normalize(suffix))
            if display:
                integrations.add(display)
                break
        else:
            # Custom / community nodes: look for a known service in the id or
            # node label (e.g. n8n-nodes-youtube-transcription-kasha...).
            for key, display in _SERVICE_NAMES.items():
                if len(key) >= 4 and (key in normalized_type or key in normalize(node_name)):
                    integrations.add(display)
                    break

    return integrations


def detect_trigger_type(nodes: Iterable[dict[str, Any]]) -> str:
    """Classify a workflow as Webhook, Scheduled, Complex or Manual."""
    nodes = list(nodes)
    trigger_type = "Manual"

    for node in nodes:
        node_type = str(node.get("type", "")).lower()
        node_name = str(node.get("name", "")).lower()

        if "webhook" in node_type or "webhook" in node_name:
            trigger_type = "Webhook"
        elif "cron" in node_type or "schedule" in node_type or "interval" in node_type:
            trigger_type = "Scheduled"
        elif "trigger" in node_type and "manual" not in node_type and trigger_type == "Manual":
            trigger_type = "Webhook"

    if len(nodes) > 10 and trigger_type == "Manual":
        trigger_type = "Complex"
    return trigger_type


def analyze_nodes(nodes: Iterable[dict[str, Any]]) -> tuple[str, set[str]]:
    """Convenience wrapper returning ``(trigger_type, integrations)``."""
    node_list = list(nodes)
    integrations = extract_integrations(node_list)
    trigger_type = detect_trigger_type(node_list)
    if len(node_list) > 10 and len(integrations) > 3:
        trigger_type = "Complex"
    return trigger_type, integrations
