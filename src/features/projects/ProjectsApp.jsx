import { useNav } from "../../app/NavProvider";
import ProjectsProvider from "./ProjectsProvider";
import ProjectsScreen from "./screens/ProjectsScreen";
import ProjectScreen from "./screens/ProjectScreen";

/** The Projects app: shares the data between the list and a project, shows one or the other. */
export default function ProjectsApp() {
  const { projectId } = useNav();
  return <ProjectsProvider>{projectId ? <ProjectScreen /> : <ProjectsScreen />}</ProjectsProvider>;
}
