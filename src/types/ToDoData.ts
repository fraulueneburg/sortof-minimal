import type { TaskData, TaskList } from '.'

export interface ToDoData {
	lists: Record<string, TaskList>
	tasksByList: Record<string, string[]>
	tasks: Record<string, TaskData>
}
