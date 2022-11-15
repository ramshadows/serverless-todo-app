import { createLogger } from '../utils/logger'

const AWSXRay = require('aws-xray-sdk')

const AWS = AWSXRay.captureAWS(require('aws-sdk'))

const logger = createLogger('AttachmentUtils')

export class AttachmentUtils {
    constructor(
      private readonly s3 = createS3Bucket(),
      private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
      private readonly urlExpiration = +process.env.SIGNED_URL_EXPIRATION
    ) {}

    async getUploadUrl(todoId: string): Promise<string> {
      logger.info(`Getting upload url for todo with id ${todoId}`)
      return this.s3.getSignedUrl('putObject', {
        Bucket: this.bucketName,
        Key: todoId,
        Expires: this.urlExpiration
      })
    }
    
    getAttachmentUrl(todoId: string): string {
      logger.info(`Getting attachement url for todo with id ${todoId}`)
      return `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
    }
  }

  
const createS3Bucket = () =>
new AWS.S3({
  signatureVersion: 'v4'
})