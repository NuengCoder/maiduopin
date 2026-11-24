# ntc project image — replace the base image and command
# with the runtime your project needs.
FROM debian:bookworm-slim
WORKDIR /app
COPY . .
CMD ["bash"]
