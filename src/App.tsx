import './assets/css/App.css'
import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, rectIntersection } from '@dnd-kit/core'

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { TaskData, ToDoData } from './utils/types'
import List from './components/List'

export default function App() {
	const [toDoData, setToDoData] = useState<ToDoData>({
		lists: {
			'list-1': {
				_id: 'list-1',
				title: 'To Do',
				color: '#ff6b6b',
			},
			'list-2': {
				_id: 'list-2',
				title: 'In Progress',
				color: '#4ecdc4',
			},
			'list-3': {
				_id: 'list-3',
				title: 'Done',
				color: '#45b7d1',
			},
		},
		tasksByList: {
			'list-1': ['task-2', 'task-1', 'task-3', 'task-4', 'task-5'],
			'list-2': [],
			'list-3': [],
		},
		tasks: {
			'task-1': {
				_id: 'task-1',
				title: 'Buy groceries',
				checked: false,
				list: 'list-1',
				position: { x: 16, y: 36.7 },
			},
			'task-2': {
				_id: 'task-2',
				title: 'Review code',
				checked: false,
				list: 'list-1',
				position: { x: 60, y: 50 },
			},
			'task-3': {
				_id: 'task-3',
				title: 'Call the dentist for appointment',
				checked: false,
				list: 'list-1',
				position: { x: 35, y: 56.7 },
			},
			'task-4': {
				_id: 'task-4',
				title: 'Submit report',
				checked: true,
				list: 'list-1',
				position: { x: 0, y: 0 },
			},
			'task-5': {
				_id: 'task-5',
				title: 'Update resume',
				checked: true,
				list: 'list-1',
				position: { x: 40, y: 60 },
			},
		},
	})

	const [activeTask, setActiveTask] = useState<TaskData | null>(null)
	const [draggedItemRef, setDraggedItemRef] = useState<HTMLElement | null>(null)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		})
	)

	function handleDragStart(event: DragStartEvent) {
		const task = toDoData.tasks[event.active.id as string]
		const taskElement = document.querySelector(`[data-task-id="${event.active.id}"]`) as HTMLElement

		setActiveTask(task || null)
		setDraggedItemRef(taskElement)
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over, delta } = event
		setActiveTask(null)

		if (!delta) return

		const taskId = active.id as string
		const currentTask = toDoData.tasks[taskId]

		if (!currentTask) return

		const taskMeasurements = draggedItemRef
			? {
					height: draggedItemRef.getBoundingClientRect().height,
					width: draggedItemRef.getBoundingClientRect().width,
					top: draggedItemRef.getBoundingClientRect().top,
					left: draggedItemRef.getBoundingClientRect().left,
			  }
			: null
		setDraggedItemRef(null)

		setToDoData((prevData) => {
			const newTasks = { ...prevData.tasks }
			const newTasksByList = { ...prevData.tasksByList }

			let newPosition = {
				x: 0,
				y: 0,
			}

			let targetListId = currentTask.list

			const targetIsDifferentList = over && over.id !== currentTask.list && prevData.lists[over.id as string]

			if (targetIsDifferentList) {
				targetListId = over.id as string

				// CASE 01: Task moved TO first list
				if (targetListId === 'list-1') {
					const draggedDistance = { x: delta.x, y: delta.y }
					const taskStartPos = { x: taskMeasurements?.left || 0, y: taskMeasurements?.top || 0 }
					const taskEndPos = { x: taskStartPos.x + draggedDistance.x, y: taskStartPos.y + draggedDistance.y }

					const listWidth = over.rect.width
					const listHeight = over.rect.height
					const listOffset = { x: over.rect.left, y: over.rect.top }

					const taskEndPosPercent = {
						x: (taskEndPos.x - listOffset.x) / (listWidth / 100),
						y: (taskEndPos.y - listOffset.y) / (listHeight / 100),
					}

					const taskWidthPercent = (taskMeasurements?.width || 0) / (listWidth / 100)
					const taskHeightPercent = (taskMeasurements?.height || 0) / (listHeight / 100)

					newPosition = {
						x: Math.max(0, Math.min(taskEndPosPercent.x, 100 - taskWidthPercent)),
						y: Math.max(0, Math.min(taskEndPosPercent.y, 100 - taskHeightPercent)),
					}
				}

				newTasksByList[currentTask.list] = newTasksByList[currentTask.list].filter((id) => id !== taskId)

				if (!newTasksByList[targetListId]) {
					newTasksByList[targetListId] = []
				}
				if (!newTasksByList[targetListId].includes(taskId)) {
					newTasksByList[targetListId].push(taskId)
				}
			} else {
				// CASE 02: Task moved WITHIN first list
				if (currentTask.list === 'list-1') {
					const listWidth = over?.rect.width || 0
					const listHeight = over?.rect.height || 0
					const distancePercent = { x: (delta.x / listWidth) * 100, y: (delta.y / listHeight) * 100 }

					const taskWidthPercent = (taskMeasurements?.width || 0) / (listWidth / 100)
					const taskHeightPercent = (taskMeasurements?.height || 0) / (listHeight / 100)

					newPosition = {
						x: Math.max(0, Math.min(currentTask.position.x + distancePercent.x, 100 - taskWidthPercent)),
						y: Math.max(0, Math.min(currentTask.position.y + distancePercent.y, 100 - taskHeightPercent)),
					}
				}
			}

			newTasks[taskId] = {
				...currentTask,
				position: newPosition,
				list: targetListId,
			}

			return {
				...prevData,
				tasks: newTasks,
				tasksByList: newTasksByList,
			}
		})
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={rectIntersection}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}>
			<div className="task-board">
				{Object.values(toDoData.lists).map((list) => (
					<List key={list._id} list={list} tasks={toDoData.tasksByList[list._id].map((taskId) => toDoData.tasks[taskId])} />
				))}
			</div>

			<DragOverlay>
				{activeTask ? (
					<section className="task dragging">
						<span>{activeTask.title}</span>
					</section>
				) : null}
			</DragOverlay>
		</DndContext>
	)
}
