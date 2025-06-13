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
function DraggableTask({ task }: { task: Task }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: task._id,
	})

	const style = {
		left: task.position.x,
		top: task.position.y,
		transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
		opacity: isDragging ? 0.3 : 1,
		zIndex: isDragging ? 1000 : 1,
	}

	return (
		<section ref={setNodeRef} style={style} {...attributes} {...listeners} className="task">
			{task.title}
		</section>
	)
}

// Droppable list area - just the visual container
function DroppableList({ list }: { list: TaskList }) {
	const { setNodeRef, isOver } = useDroppable({
		id: list._id,
	})

	const style = {
		width: list.bounds.width,
		height: list.bounds.height,
		borderColor: isOver ? 'blue' : list.color,
	}

	return (
		<div ref={setNodeRef} style={style} className="task-list">
			<h3>{list.title}</h3>
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
				bounds: { x: 20, y: 0, width: 250, height: 300 },
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
			'list-1': ['task-1', 'task-3'],
			'list-2': ['task-2'],
			'list-3': ['task-4', 'task-5'],
		},
		tasks: {
			'task-1': {
				_id: 'task-1',
				title: 'Buy groceries',
				checked: false,
				list: 'list-1',
				position: { x: 40, y: 110 },
			},
			'task-2': {
				_id: 'task-2',
				title: 'Review code',
				checked: false,
				list: 'list-2',
				position: { x: 340, y: 110 },
			},
			'task-3': {
				_id: 'task-3',
				title: 'Call dentist',
				checked: false,
				list: 'list-1',
				position: { x: 40, y: 170 },
			},
			'task-4': {
				_id: 'task-4',
				title: 'Submit report',
				checked: true,
				list: 'list-3',
				position: { x: 640, y: 110 },
			},
			'task-5': {
				_id: 'task-5',
				title: 'Update resume',
				checked: true,
				list: 'list-3',
				position: { x: 640, y: 170 },
			},
		},
	})

	const [activeTask, setActiveTask] = useState<Task | null>(null)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		})
	)

	function handleDragStart(event: DragStartEvent) {
		const task = toDoData.tasks[event.active.id as string]
		setActiveTask(task || null)
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over, delta } = event
		setActiveTask(null)

		if (!delta) return

		const taskId = active.id as string
		const currentTask = toDoData.tasks[taskId]

		if (!currentTask) return

		setToDoData((prevData) => {
			const newTasks = { ...prevData.tasks }
			const newTasksByList = { ...prevData.tasksByList }

			let newPosition = {
				x: currentTask.position.x + delta.x,
				y: currentTask.position.y + delta.y,
			}

			let targetListId = currentTask.list

			// Check if dropped over a different list
			if (over && over.id !== currentTask.list && prevData.lists[over.id as string]) {
				const newList = prevData.lists[over.id as string]
				targetListId = over.id as string

				newPosition = {
					x: Math.max(newList.bounds.x + 20, Math.min(newPosition.x, newList.bounds.x + newList.bounds.width - 160)),
					y: Math.max(newList.bounds.y + 80, Math.min(newPosition.y, newList.bounds.y + newList.bounds.height - 60)),
				}

				// Update list assignments
				newTasksByList[currentTask.list] = newTasksByList[currentTask.list].filter((id) => id !== taskId)

				if (!newTasksByList[targetListId]) {
					newTasksByList[targetListId] = []
				}
				newTasksByList[targetListId].push(taskId)
			} else {
				// Constrain within current list bounds
				const currentList = prevData.lists[currentTask.list]
				newPosition = {
					x: Math.max(
						currentList.bounds.x + 20,
						Math.min(newPosition.x, currentList.bounds.x + currentList.bounds.width - 160)
					),
					y: Math.max(
						currentList.bounds.y + 80,
						Math.min(newPosition.y, currentList.bounds.y + currentList.bounds.height - 60)
					),
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
				{/* Render list boundaries */}
				{Object.values(toDoData.lists).map((list) => (
					<DroppableList key={list._id} list={list} />
				))}

				{/* Render all tasks at board level */}
				{Object.values(toDoData.tasks).map((task) => (
					<DraggableTask key={task._id} task={task} />
				))}
			</div>

			<DragOverlay>
				{activeTask ? (
					<section className="task dragging">
						<span style={{ textDecoration: activeTask.checked ? 'line-through' : 'none' }}>{activeTask.title}</span>
					</section>
				) : null}
			</DragOverlay>
		</DndContext>
	)
}
