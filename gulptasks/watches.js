const gulp = require("gulp");
const { options } = require("./config");

gulp.task("watch", () => {
  gulp.watch("lib/**/*", [options.watch_task]);
});
