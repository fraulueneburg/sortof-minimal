import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import type { TaskData, TaskList } from '../utils/types'
import Task from './Task'

export default function List({ list, tasks, taskIds }: { list: TaskList; tasks: TaskData[]; taskIds: string[] }) {
	const isFirstList = list._id === 'list-1'

	const { setNodeRef, isOver } = useDroppable({
		id: list._id,
		data: {
			type: 'list',
			item: list,
		},
	})

	const style = {
		borderColor: isOver ? 'blue' : list.color,
	}

	const taskList = useMemo(() => {
		return tasks.map((task) => <Task key={task._id} task={task} isFreePositioning={isFirstList} />)
	}, [tasks, isFirstList])

	return (
		<div ref={setNodeRef} style={style} className={`task-list ${list._id}`}>
			<h3>{list.title}</h3>
			<ul className="task-list-content">
				{isFirstList ? (
					taskList
				) : (
					<SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
						{taskList}
					</SortableContext>
				)}
			</ul>
		</div>
	)
}
