const assignment = {
  id: 1, title: "NodeJS Assignment",
  description: "Create a NodeJS server with ExpressJS",
  due: "2021-10-10", completed: false, score: 0,
};


const courseModule = {
  id: "2",
  name: "Routes and stuff",
  description: "Learning routes and stuff",
  course: "CS4550",
};

export default function WorkingWithObjects(app) {
  const getAssignment = (req, res) => {
    res.json(assignment);
  };

  const getAssignmentTitle = (req, res) => {
    res.json(assignment.title);
  };

  const setAssignmentTitle = (req, res) => {
    const { newTitle } = req.params;
    assignment.title = newTitle;
    res.json(assignment);
  };

  const setAssignmentScore = (req, res) => {
    const { newScore } = req.params;
    assignment.score = parseInt(newScore);
    res.json(assignment);
  };

  const setAssignmentCompleted = (req, res) => {
    const { completed } = req.params;
    assignment.completed = completed === "true";
    res.json(assignment);
  };

  const getModule = (req, res) => {
    res.json(courseModule);
  };

  const getModuleName = (req, res) => {
    res.json(courseModule.name);
  };

  const setModuleName = (req, res) => {
    const { newName } = req.params;
    courseModule.name = newName;
    res.json(courseModule);
  };

  const setModuleDescription = (req, res) => {
    const { newDescription } = req.params;
    courseModule.description = newDescription;
    res.json(courseModule);
  };

  app.get("/lab5/assignment", getAssignment);
  app.get("/lab5/assignment/title", getAssignmentTitle);
  app.get("/lab5/assignment/title/:newTitle", setAssignmentTitle);
  app.get("/lab5/assignment/score/:newScore", setAssignmentScore);
  app.get("/lab5/assignment/completed/:completed", setAssignmentCompleted);
  app.get("/lab5/module", getModule);
  app.get("/lab5/module/name", getModuleName);
  app.get("/lab5/module/name/:newName", setModuleName);
  app.get("/lab5/module/description/:newDescription", setModuleDescription);
}