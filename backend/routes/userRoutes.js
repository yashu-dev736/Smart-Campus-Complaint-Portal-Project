const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/roleCheck");
const { getUsers, toggleActive } = require("../controllers/userController");

router.use(protect, authorize("admin"));

router.get("/", getUsers);
router.put("/:id/deactivate", toggleActive);

module.exports = router;
