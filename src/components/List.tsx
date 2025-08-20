import { useDroppable } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'

import type { TaskData, TaskList } from '../utils/types'
import Task from './Task'

export default function List({ list, tasks, taskIds }: { list: TaskList; tasks: TaskData[]; taskIds: string[] }) {
	const { setNodeRef, isOver } = useDroppable({
		id: list._id,
	})

	const style = {
		borderColor: isOver ? 'blue' : list.color,
	}

	return (
		<div ref={setNodeRef} style={style} className={`task-list ${list._id}`}>
			<h3>{list.title}</h3>
			<ul className="task-list-content">
				<SortableContext items={taskIds}>
					{tasks.map((task) => (
						<Task key={task._id} task={task} isFreePositioning={list._id === 'list-1'} />
					))}
				</SortableContext>
			</ul>
		</div>
	)
}
