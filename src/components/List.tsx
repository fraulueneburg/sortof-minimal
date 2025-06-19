import { useDroppable } from '@dnd-kit/core'
import type { TaskData, TaskList } from '../utils/types'
import Task from './Task'

export default function List({ list, tasks }: { list: TaskList; tasks: TaskData[] }) {
	const { setNodeRef, isOver } = useDroppable({
		id: list._id,
	})

	const style = {
		borderColor: isOver ? 'blue' : list.color,
	}

	return (
		<div ref={setNodeRef} style={style} className={`task-list ${list._id}`}>
			<h3>{list.title}</h3>
			<div className="task-list-content">
				{tasks.map((task) => (
					<Task key={task._id} task={task} isFreePositioning={list._id === 'list-1'} />
				))}
			</div>
		</div>
	)
}
