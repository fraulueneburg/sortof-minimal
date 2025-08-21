import type { TaskData } from '../utils/types'
import { useSortable } from '@dnd-kit/sortable'

export default function Task({ task, isFreePositioning }: { task: TaskData; isFreePositioning: boolean }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: task._id,
		data: {
			type: 'task',
			item: task,
		},
	})

	const style = isFreePositioning
		? {
				left: `${task.position.x}%`,
				top: `${task.position.y}%`,
				transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
				opacity: isDragging ? 0 : 1,
				zIndex: isDragging ? 1000 : 1,
		  }
		: {
				opacity: isDragging ? 0 : 1,
				zIndex: isDragging ? 1000 : 1,
				transition,
		  }

	return (
		<li ref={setNodeRef} style={style} {...attributes} {...listeners} className="task" data-task-id={task._id}>
			{task.title}
		</li>
	)
}
