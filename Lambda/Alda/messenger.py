import re
import sys
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class Messenger():

    @classmethod
    def button_template(self, text, buttons):
        return {
            "attachment": {
                "payload": {
                    "buttons": buttons,
                    "template_type": "button",
                    "text": "What do you want to do next?"
                },
                "type": "template"
            }
        }

    @classmethod
    def url_button(self, title, url):
        if self.is_valid_url(url):
            return {
                "url": url,
                "title": "Visit Messenger",
                "type": "web_url"
            }
        else:
            logger.error("URL for messenger button is not valid!")
            sys.exit()

    @classmethod
    def get_button_template(self, text, title, url):
        return self.button_template(text, [self.url_button(title, url)])

    @staticmethod
    def is_valid_url(url):
        regex = re.compile(
            r'^(?:http|ftp)s?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        result = regex.match(url)
        if result:
            return True
        else:
            return False
