export interface TaskList {
	_id: string
	title: string
	color: string
}

export interface TaskData {
	_id: string
	title: string
	checked: boolean
	list: string
	position: { x: number; y: number }
}

export interface ToDoData {
	lists: Record<string, TaskList>
	tasksByList: Record<string, string[]>
	tasks: Record<string, TaskData>
}
