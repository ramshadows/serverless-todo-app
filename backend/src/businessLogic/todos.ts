import { TodosAccess } from '../dataLayer/todosAcess'
//import { AttachmentUtils } from '../dataLayer/attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
//import * as createError from 'http-errors'

// TODO: Implement businessLogic
const todoAccess = new TodosAccess()
const logger = createLogger('businessLogic')

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  logger.info('getting all ToDos for user', userId)
  return await todoAccess.getAllTodos(userId)
}

export async function createTodoItem(
  createGroupRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  return await todoAccess.createTodoItem({
    userId,
    todoId: uuid.v4(),
    done: false,
    createdAt: new Date().toISOString(),
    ...createGroupRequest
  })
}

export async function generateUploadUrl(
  userId: string,
  todoId: string
): Promise<string> {
  //const uploadUrl = await todoAccess.getSignedUrl(todoId)
  const uploadUrl = await todoAccess.updateAttachmentUrl(userId, todoId)

  return uploadUrl
}

export async function updateTodoItem(
  updateTodoRequest: UpdateTodoRequest,
  userId: string,
  todoId: string
): Promise<void> {
  await todoAccess.updateTodoItem(updateTodoRequest, userId, todoId)
}

export async function deleteTodoItem(userId: string, todoId: string) {
  await Promise.all([
    todoAccess.deleteTodoItem(userId, todoId),
    //todoAccess.deleteTodoItemAttachment(todoId)
  ])
}