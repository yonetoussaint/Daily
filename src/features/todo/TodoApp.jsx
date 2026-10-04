import TodoProvider from "./TodoProvider";
import TodoScreen from "./screens/TodoScreen";

/** The Todo app: a quick list per place (Easy Gaz Plus, Personal…), built for jotting things down the moment you're told. */
export default function TodoApp() {
  return (
    <TodoProvider>
      <TodoScreen />
    </TodoProvider>
  );
}
