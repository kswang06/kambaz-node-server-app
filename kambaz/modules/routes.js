import ModulesDao from "./dao.js";

export default function ModulesRoutes(app, db) {
  const dao = ModulesDao(db);

  const findModulesForCourse = async (req, res) => {
    const { cid } = req.params;
    const modules = await dao.findModulesForCourse(cid);
    res.json(modules);
  };

  const createModuleForCourse = async (req, res) => {
    const { cid } = req.params;
    const module = {
      ...req.body,
    };
    const newModule = await dao.createModule(cid,module);
    res.json(newModule);
  };
  const deleteModule = async (req, res) => {
    const { cid, mid } = req.params;
    const status = await dao.deleteModule(cid, mid);
    res.send(status);
  }

  const updateModule = async (req, res) => {
    const { cid, mid } = req.params;
    const moduleUpdates = req.body;
    const status = await dao.updateModule(cid, mid, moduleUpdates);
    res.send(status);
    }
  app.put("/api/courses/:cid/modules/:mid", updateModule);
  app.delete("/api/courses/:cid/modules/:mid", deleteModule);
  app.get("/api/courses/:cid/modules", findModulesForCourse);
  app.post("/api/courses/:cid/modules", createModuleForCourse);
}
