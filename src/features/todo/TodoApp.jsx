import TodoProvider from "./TodoProvider";
import TodoScreen from "./screens/TodoScreen";

/** The Todo app: quick lists per place (Personal, your own…), built for jotting things down the moment you're told. */
export default function TodoApp() {
  return (
    <TodoProvider>
      <TodoScreen />
    </TodoProvider>
  );
}
