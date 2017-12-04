import pymysql.cursors
import json
import logging
import sys
import requests
import datetime
from saltedge import SaltEdge
from person import Person
import configparser
from dialogflow import Dialogflow

config = configparser.ConfigParser()
config.read('config.ini')

logger = logging.getLogger()
logger.setLevel(logging.INFO)

logger.info('Starting')

try:
    # Connect to the database
    connection = pymysql.connect(
        host=config['DEFAULT']['mysqlHost'],
        user=config['DEFAULT']['mysqlUser'],
        password=config['DEFAULT']['mysqlPassword'],
        db=config['DEFAULT']['mysqlDB'],
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
except connection.Error:
    logger.error("ERROR: Unexpected error: Could not connect to MySql instance.")
    sys.exit()

logger.info("SUCCESS: Connection to RDS mysql instance succeeded")

# [{\n "text": {\n "text": ["Llegaste al lugar correcto! 💰"]\n }\n },
# {\n "text": {\n "text": ["Cuanto dinero quieres ahorrar para cuando?"]\n }\n }]

def handler(event, context):
    print(event)

    request = json.loads(event['body'])
    person = Person(connection, request)

    # if not first time interaction try to refresh data
    if person.intentName != "alda.initialize":
        if person.isRegistered:
            person.refresh()
        else:
            person.initialize()

    # LOGIC
    # elif person.intentName == "alda.define.budget":
    #     fulfillment = defineBudget(facebook_id, request)
    # elif person.intentName == "alda.query.budget":
    #     fulfillment = queryBudget(facebook_id)
    if person.intentName == "alda.initialize":
        person.initialize()
    elif person.intentName == "alda.add.bank":
        person.addBank()
    elif person.intentName == "alda.query.balance":
        person.queryBalance()
    elif person.intentName == "alda.query.expenses":
        person.queryExpenses()
    elif person.has_fulfillment:
        person.set_received_fulfillment()
    else:
        Dialogflow.not_understood()

    with connection.cursor() as cursor:
        sql = "INSERT INTO `conversation` (`message`, `response`, `sender_id`) VALUES (%s, %s, %s)"
        cursor.execute(sql, (person.queryText, person.get_fulfillmentText(), person.sender_id))
        connection.commit()

    return person.get_response()


# def defineBudget(sender_id, request):
#     budget = request['result']['parameters']['budget']
#     # currency = request['result']['parameters']['currency']
#
#     with connection.cursor() as cursor:
#         query = """ INSERT INTO `budget` (`facebook_id`, `budget`)
#                     VALUES (%s, %s)
#                     ON DUPLICATE KEY UPDATE
#                     facebook_id = VALUES(facebook_id), budget = VALUES(budget)
#                 """
#         cursor.execute(query, (person.sender_id, budget))
#         connection.commit()
#
#     speech = 'Ya te he puesto %s€ por este mes. Ahora me puedes preguntar por tu presupuesto 😉' % (budget)
#     return {
#         'speech': speech
#     }
#
#
# def queryBudget(facebook_id):
#     today = datetime.datetime.now()
#     day_today = today.day
#     days_of_month = last_day_of_month(today).day
#     days_left_this_month = days_of_month - day_today
#     month_begin = today.replace(day=1)
#     month_end = last_day_of_month(today)
#
#     with connection.cursor() as cursor:
#         query = """
#                     SELECT `budget` FROM `budget`
#                     WHERE `facebook_id`=%s
#                 """
#         cursor.execute(query, (facebook_id))
#         result = cursor.fetchone()
#         budget = result['budget']
#
#         query = """
#                     SELECT SUM(t.`amount`) AS expenses
#                     FROM `transaction` t
#                         INNER JOIN account a ON t.`account_id` = a.`id`
#                         INNER JOIN login l ON a.`login_id` = l.`id`
#                         INNER JOIN customer c ON l.`customer_id` = c.`id`
#                     WHERE c.`facebook_id` = %s AND t.`amount` < 0  AND %s <= t.`made_on` and t.`made_on`<= %s
#                 """
#         cursor.execute(query, (facebook_id, month_begin.strftime("%Y-%m-%d"), month_end.strftime("%Y-%m-%d")))
#         result = cursor.fetchone()
#         expenses = -result['expenses']
#         logger.info("budget: %s %s %s" % (facebook_id, month_begin.strftime("%Y-%m-%d"), month_end.strftime("%Y-%m-%d")))
#
#     day_budget = (budget-expenses)/days_left_this_month
#     month_budget = budget-expenses
#
#     # 💰
#     day_response = "Dia: %.0f€💸" % (day_budget)
#     month_response = "Mes: %.0f€ de %.0f€💶" % (month_budget, budget)
#     introduction_response = "Estas bien..."
#
#     speech = introduction_response+"\r\n\r\n"+day_response+"\r\n"+month_response
#     return {
#         'speech': speech
#     }


# def last_day_of_month(any_day):
#     next_month = any_day.replace(day=28) + datetime.timedelta(days=4)
#     return next_month - datetime.timedelta(days=next_month.day)
