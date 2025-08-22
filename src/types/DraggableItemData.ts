import type { TaskData, TaskList } from '.'

export type DraggableItemData =
	| {
			type: 'task'
			item: TaskData
	  }
	| {
			type: 'list'
			item: TaskList
	  }
