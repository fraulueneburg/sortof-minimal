import './App.css'
import { useState } from 'react'
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
	useDraggable,
	useDroppable,
	rectIntersection,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

interface Task {
	_id: string
	title: string
	checked: boolean
	list: string
	position: { x: number; y: number }
}

interface TaskList {
	_id: string
	title: string
	color: string
	bounds: { x: number; y: number; width: number; height: number }
}

interface ToDoData {
	lists: Record<string, TaskList>
	tasksByList: Record<string, string[]>
	tasks: Record<string, Task>
}

// Free draggable task - positioned absolutely on the board
function DraggableTask({ task, isFreePositioning }: { task: Task; isFreePositioning: boolean }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: task._id,
	})

	const style = isFreePositioning
		? {
				left: `${task.position.x}%`,
				top: `${task.position.y}%`,
				transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
				zIndex: isDragging ? 1000 : 1,
				position: 'absolute' as const,
		  }
		: {
				zIndex: isDragging ? 1000 : 1,
		  }

	return (
		<section ref={setNodeRef} style={style} {...attributes} {...listeners} className="task" data-task-id={task._id}>
			{task.title}
		</section>
	)
}

// Droppable list area - just the visual container
function DroppableList({ list, tasks }: { list: TaskList; tasks: Task[] }) {
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
					<DraggableTask key={task._id} task={task} isFreePositioning={list._id === 'list-1'} />
				))}
			</div>
		</div>
	)
}

export default function App() {
	const [toDoData, setToDoData] = useState<ToDoData>({
		lists: {
			'list-1': {
				_id: 'list-1',
				title: 'To Do',
				color: '#ff6b6b',
				bounds: { x: 0, y: 0, width: 250, height: 300 },
			},
			'list-2': {
				_id: 'list-2',
				title: 'In Progress',
				color: '#4ecdc4',
				bounds: { x: 320, y: 0, width: 250, height: 300 },
			},
			'list-3': {
				_id: 'list-3',
				title: 'Done',
				color: '#45b7d1',
				bounds: { x: 620, y: 0, width: 250, height: 300 },
			},
		},
		tasksByList: {
			'list-1': [],
			'list-2': ['task-2', 'task-1', 'task-3'],
			'list-3': ['task-4', 'task-5'],
		},
		tasks: {
			'task-1': {
				_id: 'task-1',
				title: 'Buy groceries',
				checked: false,
				list: 'list-2',
				position: { x: 16, y: 36.7 }, // 40px/250px * 100, 110px/300px * 100
			},
			'task-2': {
				_id: 'task-2',
				title: 'Review code',
				checked: false,
				list: 'list-2',
				position: { x: 0, y: 0 },
			},
			'task-3': {
				_id: 'task-3',
				title: 'Call the dentist immediately',
				checked: false,
				list: 'list-2',
				position: { x: 16, y: 56.7 }, // 40px/250px * 100, 170px/300px * 100
			},
			'task-4': {
				_id: 'task-4',
				title: 'Submit report',
				checked: true,
				list: 'list-3',
				position: { x: 0, y: 0 },
			},
			'task-5': {
				_id: 'task-5',
				title: 'Update resume',
				checked: true,
				list: 'list-3',
				position: { x: 0, y: 0 },
			},
		},
	})

	const [activeTask, setActiveTask] = useState<Task | null>(null)
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
					right: draggedItemRef.getBoundingClientRect().right,
					bottom: draggedItemRef.getBoundingClientRect().bottom,
					left: draggedItemRef.getBoundingClientRect().left,
			  }
			: null
		setDraggedItemRef(null)

		setToDoData((prevData) => {
			const newTasks = { ...prevData.tasks }
			const newTasksByList = { ...prevData.tasksByList }

			let newPosition = {
				x: currentTask.position.x + delta.x,
				y: currentTask.position.y + delta.y,
			}

			let targetListId = currentTask.list

			const targetIsDifferentList = over && over.id !== currentTask.list && prevData.lists[over.id as string]

			if (targetIsDifferentList) {
				const newList = prevData.lists[over.id as string]

				targetListId = over.id as string

				// CASE 01: Task moved TO first list
				if (targetListId === 'list-1') {
					const mouseEvent = event.activatorEvent as MouseEvent

					const mouseStartPosX = mouseEvent.clientX
					const mouseStartPosY = mouseEvent.clientY

					const mouseEndPosX = mouseEvent.clientX + delta.x
					const mouseEndPosY = mouseEvent.clientY + delta.y

					const taskWidth = taskMeasurements?.width || 0
					const taskHeight = taskMeasurements?.height || 0
					const taskStartTop = taskMeasurements?.top || 0
					const taskStartLeft = taskMeasurements?.left || 0
					// const taskStartRight = taskMeasurements?.right || 0
					// const taskStartBottom = taskMeasurements?.bottom || 0

					const targetListWidth = over.rect.width
					const targetListHeight = over.rect.height
					const targetListTop = over.rect.top
					const targetListRight = over.rect.right
					const targetListBottom = over.rect.bottom
					const targetListLeft = over.rect.left

					// console.log('over.rect', over.rect)
					// console.log('mouseEvent', mouseEvent)
					// console.log('Task measurements:', taskMeasurements)

					// console.log('Mouse positions at drag:', {
					// 	startPosition: {
					// 		x: mouseEvent.clientX,
					// 		y: mouseEvent.clientY,
					// 	},
					// 	theEndPosition: {
					// 		x: mouseEvent.clientX + delta.x,
					// 		y: mouseEvent.clientY + delta.y,
					// 	},
					// })

					console.log('-----------------')

					const dropXPercent = ((over.rect.left + over.rect.width / 2 - newList.bounds.x) / newList.bounds.width) * 100
					const dropYPercent = ((over.rect.top + over.rect.height / 2 - newList.bounds.y) / newList.bounds.height) * 100

					// Use the stored measurements to calculate the position
					const taskWidthPercent = taskMeasurements ? (taskMeasurements.width / newList.bounds.width) * 100 : 64
					const taskHeightPercent = taskMeasurements ? (taskMeasurements.height / newList.bounds.height) * 100 : 20

					newPosition = {
						x: Math.max(0, Math.min(dropXPercent, 100 - taskWidthPercent)),
						y: Math.max(0, Math.min(dropYPercent, 100 - taskHeightPercent)),
					}
				}

				// Update list assignments - remove from old list first
				newTasksByList[currentTask.list] = newTasksByList[currentTask.list].filter((id) => id !== taskId)

				// Add to new list if not already present
				if (!newTasksByList[targetListId]) {
					newTasksByList[targetListId] = []
				}
				if (!newTasksByList[targetListId].includes(taskId)) {
					newTasksByList[targetListId].push(taskId)
				}
			} else {
				// CASE 02: Task moved WITHIN the first list
				if (currentTask.list === 'list-1') {
					const currentList = prevData.lists[currentTask.list]

					// Convert delta to percentage
					const deltaXPercent = (delta.x / currentList.bounds.width) * 100
					const deltaYPercent = (delta.y / currentList.bounds.height) * 100

					newPosition = {
						x: Math.max(0, Math.min(currentTask.position.x + deltaXPercent, 100 - 64)),
						y: Math.max(0, Math.min(currentTask.position.y + deltaYPercent, 100 - 20)),
					}
				}
				// For other lists, maintain vertical positioning
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
					<DroppableList
						key={list._id}
						list={list}
						tasks={toDoData.tasksByList[list._id].map((taskId) => toDoData.tasks[taskId])}
					/>
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
