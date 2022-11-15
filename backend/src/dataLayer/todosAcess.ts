//import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { AttachmentUtils } from './attachmentUtils'

const AWSXRay = require('aws-xray-sdk')

const AWS = AWSXRay.captureAWS(require('aws-sdk'))

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
    private readonly s3 = new AWS.S3({ signatureVersion: 'v4' }),
    private readonly todoTable = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.IMAGES_S3_BUCKET,
    //private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private attachementCtrl : AttachmentUtils = new AttachmentUtils()
  ) {}

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    console.log('Getting all ToDos')

    const result = await this.docClient
      .query({
        TableName: this.todoTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false
        
      })
      .promise()
    logger.info('TODOs results', result)
    const items = result.Items
    return items as TodoItem[]
  }

  async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todoTable,
        Item: {
          ...todoItem
        }
      })
      .promise()

    return todoItem
  }

/*  async getSignedUrl(todoId: string): Promise<string> {
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: this.urlExpiration
    })
  }
*/
  async updateAttachmentUrl(userId: string, todoId: string): Promise<string> {
    const UploadUrl = await this.attachementCtrl.getUploadUrl(todoId);
    const attachementUrl = await this.attachementCtrl.getAttachmentUrl(todoId);
    await this.docClient
      .update({
        TableName: this.todoTable,
        Key: {
          userId: userId,
          todoId: todoId
        },
        UpdateExpression: 'set attachmentUrl=:attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachementUrl,
        },
        ReturnValues: 'UPDATED_NEW'
      },
      function (err, data) {
        if (err) {
          const error = JSON.stringify(err, null, 2)
          logger.error('=> Unable to update item. Error JSON:', error)
        } else {
          const updatedItem = JSON.stringify(data, null, 2)
          logger.info('=> Successfully updated todo:', updatedItem)
        }
      }
    )
    .promise()
    return UploadUrl;
}


  async updateTodoItem(
    TodoUpdate: TodoUpdate,
    userId: string,
    todoId: string
  ): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todoTable,
        Key: {
          userId: userId,
          todoId: todoId
        },
        ExpressionAttributeNames: { '#N': 'name' },
        UpdateExpression: 'set #N=:name, dueDate=:dueDate, done=:done',
        ExpressionAttributeValues: {
          ':name': TodoUpdate.name,
          ':dueDate': TodoUpdate.dueDate,
          ':done': TodoUpdate.done
        },

        ReturnValues: 'UPDATED_NEW'
        

      },
      function (err, data) {
        if (err) {
          const error = JSON.stringify(err, null, 2)
          logger.error('=> Unable to update item. Error JSON:', error)
        } else {
          const updatedItem = JSON.stringify(data, null, 2)
          logger.info('=> Successfully updated todo:', updatedItem)
        }
      }
    )
    .promise()
    
}

  async deleteTodoItem(userId: string, todoId: string): Promise<void> {
    logger.info('Deleting todo item : ', { todoId, userId })
    await this.docClient
      .delete({
        TableName: this.todoTable,
        Key: {
          userId: userId,
          todoId: todoId
        }
      })
      .promise()
  }

  async deleteTodoItemAttachment(bucketKey: string): Promise<void> {
    await this.s3
      .deleteObject({
        Bucket: this.bucketName,
        Key: bucketKey
      })
      .promise()
  }
}

