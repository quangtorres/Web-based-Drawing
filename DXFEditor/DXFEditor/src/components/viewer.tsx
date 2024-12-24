import React, { useState, useRef, useEffect } from "react";
import { fabric } from "fabric";
import Toolbars from "./toolBar";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import {
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { MenuIcon } from "lucide-react";

const DXFViewer: React.FC = () => {
  const [file, setFile] = useState<any>(null);
  const [drawingMode, setDrawingMode] = useState<
    "none" | "line" | "polygon" | "circle" | "pan"
  >("none");
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [strokeWidth, setStrokeWidth] = useState<number>(1);
  const [textInput, setTextInput] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(24);
  const [textColor, setTextColor] = useState<string>("#000000");
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [isPannings, setIsPanning] = useState<boolean>(false);
  const [scale, setScale] = useState("");

  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  useEffect(() => {
    if (isDarkMode) {
      setTextColor("#FFFFFF");
    }
  }, [isDarkMode]);

  const [polygonPoints, setPolygonPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvas = useRef<fabric.Canvas | null>(null);

  const currentLine = useRef<fabric.Line | null>(null);
  const currentPolygon = useRef<fabric.Polygon | null>(null);
  const currentCircle = useRef<fabric.Circle | null>(null);

  const [imageData, setImageData] = useState<HTMLImageElement | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawings = [
    {
      id: 1,
      name: "Drawing 1",
    },
    {
      id: 2,
      name: "Drawing 2",
    },
    {
      id: 3,
      name: "Drawing 3",
    },
  ];

  const toggleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  useEffect(() => {
    const imageUrl = "your-large-image-url.png";

    const img = new Image();
    img.onload = () => {
      const reducedImageDataUrl = reduceImageResolution(img);

      setImageData(new Image());

      if (imageData) {
        imageData.src = reducedImageDataUrl;
      }
    };
    img.src = imageUrl;
  }, [file]);

  useEffect(() => {
    if (imageData && canvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current);

      fabric.Image.fromURL(imageData.src, (img) => {
        canvas.add(img);
      });
    }
  }, [imageData]);

  const reduceImageResolution = (img: HTMLImageElement) => {
    const canvasTemp = document.createElement("canvas");
    const ctx = canvasTemp.getContext("2d");

    const scaleFactor = 0.5;
    canvasTemp.width = img.width * scaleFactor;
    canvasTemp.height = img.height * scaleFactor;

    if (ctx) {
      ctx.drawImage(img, 0, 0, canvasTemp.width, canvasTemp.height);
    }

    return canvasTemp.toDataURL();
  };
  const canvasToDXF = (canvas: fabric.Canvas): string => {
    let dxfContent =
      "0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nENDSEC\n0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n";

    canvas.getObjects().forEach((obj) => {
      if (obj.type === "line") {
        const line = obj as fabric.Line;
        dxfContent += `0\nLINE\n8\n0\n10\n${line.x1}\n20\n${line.y1}\n30\n0.0\n11\n${line.x2}\n21\n${line.y2}\n31\n0.0\n`;
      } else if (obj.type === "circle") {
        const circle = obj as fabric.Circle;

        const left = circle.left ?? 0;
        const top = circle.top ?? 0;
        const radius = circle.radius ?? 0;

        dxfContent += `0\nCIRCLE\n8\n0\n10\n${left + radius}\n20\n${
          top + radius
        }\n30\n0.0\n40\n${radius}\n`;
      } else if (obj.type === "polyline") {
        const points = (obj as fabric.Polyline).points;
        if (points && points.length > 0) {
          dxfContent += `0\nPOLYLINE\n8\n0\n10\n${points[0].x}\n20\n${points[0].y}\n30\n0.0\n`;
          points.slice(1).forEach((point) => {
            dxfContent += `0\nVERTEX\n8\n0\n10\n${point.x}\n20\n${point.y}\n30\n0.0\n`;
          });
          dxfContent += "0\nSEQEND\n";
        }
      }
    });

    dxfContent += "0\nENDSEC\n0\nSECTION\n2\nOBJECTS\n0\nENDSEC\n0\nEOF\n";
    return dxfContent;
  };

  const handleDownloadDXF = () => {
    if (canvas.current) {
      // Chuyển đổi Canvas thành chuỗi DXF
      const dxfString = canvasToDXF(canvas.current);

      // Tạo Blob và URL để tải xuống
      const blob = new Blob([dxfString], { type: "application/dxf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "drawing.dxf"; // Tên file DXF khi tải xuống
      link.click(); // Kích hoạt tải xuống
    }
  };
  useEffect(() => {
    if (canvasRef.current && !canvas.current) {
      canvas.current = new fabric.Canvas(canvasRef.current);
    }
    if (drawingMode === "line" && canvas.current) {
      const handleMouseDown = (e: fabric.IEvent) => {
        const pointer = canvas.current?.getPointer(e.e);
        if (pointer) {
          setStartPoint({ x: pointer.x, y: pointer.y });

          const newLine = new fabric.Line(
            [pointer.x, pointer.y, pointer.x, pointer.y],
            {
              stroke: isDarkMode ? "white" : "blue",
              strokeWidth: strokeWidth,
              selectable: true,
            }
          );
          canvas.current?.add(newLine);
          currentLine.current = newLine;
        }
      };

      const handleMouseMove = (e: fabric.IEvent) => {
        if (startPoint && currentLine.current) {
          const pointer = canvas.current?.getPointer(e.e);
          if (pointer) {
            currentLine.current.set({ x2: pointer.x, y2: pointer.y });
            canvas.current?.renderAll();
          }
        }
      };

      const handleMouseUp = () => {
        if (startPoint && currentLine.current) {
          setStartPoint(null);
          currentLine.current.set({ selectable: true });
          currentLine.current = null;
        }
      };

      canvas.current.on("mouse:down", handleMouseDown);
      canvas.current.on("mouse:move", handleMouseMove);
      canvas.current.on("mouse:up", handleMouseUp);

      return () => {
        if (canvas.current) {
          canvas.current.off("mouse:down", handleMouseDown);
          canvas.current.off("mouse:move", handleMouseMove);
          canvas.current.off("mouse:up", handleMouseUp);
        }
      };
    }

    if (drawingMode === "polygon" && canvas.current) {
      const handleMouseDown = (e: fabric.IEvent) => {
        const pointer = canvas.current?.getPointer(e.e);
        if (pointer) {
          setPolygonPoints((prevPoints) => [
            ...prevPoints,
            { x: pointer.x, y: pointer.y },
          ]);

          if (polygonPoints.length > 0) {
            const lastPoint = polygonPoints[polygonPoints.length - 1];
            const line = new fabric.Line(
              [lastPoint.x, lastPoint.y, pointer.x, pointer.y],
              {
                stroke: isDarkMode ? "white" : "blue",
                strokeWidth: strokeWidth,
                selectable: true,
              }
            );
            canvas.current?.add(line);
          }
        }
      };

      const handleDoubleClick = () => {
        if (polygonPoints.length > 2) {
          const polygon = new fabric.Polygon(polygonPoints, {
            fill: "rgba(0, 0, 255, 0.3)",
            stroke: isDarkMode ? "white" : "blue",
            strokeWidth: strokeWidth,
            selectable: true,
          });

          canvas.current?.add(polygon);
          setPolygonPoints([]);
          currentPolygon.current = polygon;
        }
      };

      canvas.current.on("mouse:down", handleMouseDown);
      canvas.current.on("mouse:dblclick", handleDoubleClick);

      return () => {
        if (canvas.current) {
          canvas.current.off("mouse:down", handleMouseDown);
          canvas.current.off("mouse:dblclick", handleDoubleClick);
        }
      };
    }
    if (drawingMode === "circle" && canvas.current) {
      canvas.current.selection = false;

      const handleMouseDownCircle = (e: fabric.IEvent) => {
        if (!canvas.current) return; // Thêm kiểm tra an toàn
        const pointer = canvas.current.getPointer(e.e);
        if (pointer) {
          setStartPoint({ x: pointer.x, y: pointer.y });

          const newCircle = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            fill: "transparent",
            stroke: isDarkMode ? "white" : "blue",
            strokeWidth: strokeWidth,
            selectable: true,
            hasBorders: false,
            hasControls: false,
          });
          canvas.current.add(newCircle);
          currentCircle.current = newCircle;
        }
      };

      const handleMouseMoveCircle = (e: fabric.IEvent) => {
        if (!canvas.current || !startPoint || !currentCircle.current) return;
        const pointer = canvas.current.getPointer(e.e);
        if (pointer) {
          const radius = Math.sqrt(
            Math.pow(pointer.x - startPoint.x, 2) +
              Math.pow(pointer.y - startPoint.y, 2)
          );
          currentCircle.current.set({ radius });
          canvas.current.renderAll();
        }
      };

      const handleMouseUpCircle = () => {
        if (!canvas.current) return;
        if (currentCircle.current) {
          currentCircle.current.set({
            selectable: true,
          });
          currentCircle.current = null;
        }
        setStartPoint(null);
      };

      canvas.current.on("mouse:down", handleMouseDownCircle);
      canvas.current.on("mouse:move", handleMouseMoveCircle);
      canvas.current.on("mouse:up", handleMouseUpCircle);

      return () => {
        if (canvas.current) {
          canvas.current.off("mouse:down", handleMouseDownCircle);
          canvas.current.off("mouse:move", handleMouseMoveCircle);
          canvas.current.off("mouse:up", handleMouseUpCircle);
        }
      };
    } else if (canvas.current) {
      canvas.current.selection = true;
    }
  }, [drawingMode, startPoint, polygonPoints]);

  useEffect(() => {
    if (canvas.current && isPannings === true) {
      const fabricCanvas = canvas.current;

      let isPanning = false;
      let lastPosX: number | null = null;
      let lastPosY: number | null = null;

      const handleMouseDown = (opt: fabric.IEvent<Event>) => {
        if (opt.e instanceof MouseEvent && opt.e.button === 0) {
          // Left click
          isPanning = true;
          lastPosX = opt.e.clientX;
          lastPosY = opt.e.clientY;
          fabricCanvas.setCursor("grab");
          fabricCanvas.selection = false; // Disable selection during pan
        }
      };

      const handleMouseMove = (opt: fabric.IEvent<Event>) => {
        const e = opt.e as MouseEvent;
        if (isPanning && lastPosX !== null && lastPosY !== null) {
          const deltaX = e.clientX - lastPosX;
          const deltaY = e.clientY - lastPosY;
          fabricCanvas.relativePan(new fabric.Point(deltaX, deltaY));
          lastPosX = e.clientX;
          lastPosY = e.clientY;
        }
      };

      const handleMouseUp = () => {
        isPanning = false;
        lastPosX = null;
        lastPosY = null;
        fabricCanvas.setCursor("default");
        fabricCanvas.selection = true; // Enable selection after pan
      };

      const handleMouseWheel = (opt: fabric.IEvent<Event>) => {
        const evt = opt.e as WheelEvent;
        const zoom = fabricCanvas.getZoom();
        const delta = evt.deltaY > 0 ? -0.00001 : 0.00001;
        const newZoom = Math.min(Math.max(zoom + delta, 0.5), 20); // Zoom limits from 0.5x to 5x

        const scaleFactor = 500; // Hệ số quy đổi, có thể thay đổi nếu muốn tỷ lệ khác
        const scaleRatio = Math.round((1 / newZoom) * scaleFactor); // Tính tỷ lệ 1:x
        const zoomLabel = `1:${scaleRatio}`; // Tạo chuỗi tỷ lệ

        // Cập nhật zoom
        const pointer = fabricCanvas.getPointer(evt);
        fabricCanvas.zoomToPoint(pointer, newZoom);
        fabricCanvas.setZoom(newZoom);

        // Cập nhật tỷ lệ vào state
        setScale(zoomLabel);

        evt.preventDefault();
        evt.stopPropagation();
      };

      fabricCanvas.on("mouse:down", handleMouseDown);
      fabricCanvas.on("mouse:move", handleMouseMove);
      fabricCanvas.on("mouse:up", handleMouseUp);
      fabricCanvas.on("mouse:wheel", handleMouseWheel);

      return () => {
        fabricCanvas.off("mouse:down", handleMouseDown);
        fabricCanvas.off("mouse:move", handleMouseMove);
        fabricCanvas.off("mouse:up", handleMouseUp);
        fabricCanvas.off("mouse:wheel", handleMouseWheel);
      };
    }
  }, [isPannings]);

  useEffect(() => {
    if (canvas.current && isPannings === true) {
      const fabricCanvas = canvas.current;

      let isPanning = false;
      let lastPosX: number | null = null;
      let lastPosY: number | null = null;

      const handleMouseDown = (opt: fabric.IEvent<Event>) => {
        const evt = opt.e as MouseEvent;
        if (evt.button === 0) {
          isPanning = true;
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
          fabricCanvas.setCursor("grab");
          fabricCanvas.selection = false;
        }
      };

      const handleMouseMove = (opt: fabric.IEvent<Event>) => {
        if (isPanning && lastPosX !== null && lastPosY !== null) {
          const evt = opt.e as MouseEvent;
          const deltaX = evt.clientX - lastPosX;
          const deltaY = evt.clientY - lastPosY;

          fabricCanvas.relativePan(new fabric.Point(deltaX, deltaY));

          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        }
      };

      const handleMouseUp = () => {
        isPanning = false;
        lastPosX = null;
        lastPosY = null;
        fabricCanvas.setCursor("default");
        fabricCanvas.selection = true;
      };

      const handleMouseWheel = (opt: fabric.IEvent<Event>) => {
        const evt = opt.e as WheelEvent; // Ép kiểu về WheelEvent
        const zoom = fabricCanvas.getZoom();
        const delta = evt.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.min(Math.max(zoom + delta, 0.5), 5); 

        const pointer = fabricCanvas.getPointer(evt);
        fabricCanvas.zoomToPoint(pointer, newZoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      };

      fabricCanvas.on("mouse:down", handleMouseDown);
      fabricCanvas.on("mouse:move", handleMouseMove);
      fabricCanvas.on("mouse:up", handleMouseUp);
      fabricCanvas.on("mouse:wheel", handleMouseWheel);

      return () => {
        fabricCanvas.off("mouse:down", handleMouseDown);
        fabricCanvas.off("mouse:move", handleMouseMove);
        fabricCanvas.off("mouse:up", handleMouseUp);
        fabricCanvas.off("mouse:wheel", handleMouseWheel);
      };
    }
  }, [isPannings]);
  const workerRef = React.useRef<Worker | null>(null);
  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const uploadedFile = event.target.files?.[0];

    if (!uploadedFile) {
      console.error("No file selected");
      return;
    }

    if (!uploadedFile.name.endsWith(".dxf")) {
      console.error("Invalid file type. Please upload a DXF file.");
      return;
    }

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    initializeWorker(uploadedFile);
  };

  const initializeWorker = (file: File) => {
    workerRef.current = new Worker(new URL("./dxFWorker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current.postMessage(file); 

    workerRef.current.onmessage = (e) => {
      const datas = e.data;
      if (datas.success === true) {
        setFile(datas.data); 
      } else {
        console.error("Error parsing DXF:", datas.error);
      }
    };

    workerRef.current.onerror = (error) => {
      console.error("Worker error:", error.message);
    };
  };

  const calculateBoundingBox = (entities: any[]) => {
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    entities.forEach((entity) => {
      if (entity.vertices) {
        entity.vertices.forEach((vertex: { x: number; y: number }) => {
          minX = Math.min(minX, vertex.x);
          minY = Math.min(minY, vertex.y);
          maxX = Math.max(maxX, vertex.x);
          maxY = Math.max(maxY, vertex.y);
        });
      }
    });

    return { minX, minY, maxX, maxY };
  };
  useEffect(() => {
    if (file && canvas.current) {
      const { minX, minY, maxX, maxY } = calculateBoundingBox(file.entities);
      const dxfWidth = maxX - minX;
      const dxfHeight = maxY - minY;
      const canvasWidth = canvas.current.width || 1920;
      const canvasHeight = canvas.current.height || 800;
      const scale =
        Math.min(canvasWidth / dxfWidth, canvasHeight / dxfHeight) * 0.9;
      const offsetX = (canvasWidth - dxfWidth * scale) / 2 - minX * scale;
      const offsetY = (canvasHeight - dxfHeight * scale) / 2 - minY * scale;

      canvas.current.clear();

      const lines = file.entities.filter(
        (entity: any) => entity.type === "LINE"
      );

      const drawLines = () => {
        lines.forEach((line: any, index: number) => {
          setTimeout(() => {
            const x1 = line.vertices[0].x * scale + offsetX;
            const y1 = line.vertices[0].y * scale + offsetY;
            const x2 = line.vertices[1].x * scale + offsetX;
            const y2 = line.vertices[1].y * scale + offsetY;

            const fabricLine = new fabric.Line([x1, y1, x2, y2], {
              stroke: isDarkMode ? "white" : "black",
              strokeWidth: strokeWidth,
              selectable: true,
            });
            canvas?.current?.add(fabricLine);
          }, index * 10); // Mỗi phần vẽ sẽ được thực hiện sau 10ms
        });
      };

      // Gọi hàm vẽ
      drawLines();
    }
  }, [file]);

  const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setStrokeWidth(value);
      if (canvas.current) {
        const activeObjects = canvas.current.getActiveObjects();
        activeObjects.forEach((obj) => {
          obj.set("strokeWidth", value);
        });
        canvas.current.renderAll();
      }
    }
  };
  const handleAddText = () => {
    if (canvas.current && textInput.trim()) {
      const text = new fabric.Text(textInput, {
        left: 100,
        top: 100,
        fontSize,
        fill: textColor,
        fontFamily,
        selectable: true,
      });
      canvas.current.add(text);
      canvas.current.renderAll();
      setTextInput("");
    }
  };
  const handleTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setTextColor(newColor);

    if (canvas.current) {
      const activeObject = canvas.current.getActiveObject();
      if (activeObject && activeObject.type === "text") {
        (activeObject as fabric.Text).set({ fill: newColor });
        canvas.current.renderAll();
      }
    }
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFontSize = Number(e.target.value);
    setFontSize(newFontSize);

    if (canvas.current) {
      const activeObject = canvas.current.getActiveObject();
      if (activeObject && activeObject.type === "text") {
        (activeObject as fabric.Text).set({ fontSize: newFontSize });
        canvas.current.renderAll();
      }
    }
  };
  const handleClickItem = (drawing: any) => {
    console.log(`Selected: ${drawing}`);
  };

  return (
    <>
      <div
        style={{
          display: "block",
          width: "auto",
          overflowX: "hidden",
          overflowY: "hidden",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              padding={1}
            >
              <Typography variant="h6">DXF Viewer/Editor</Typography>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </AppBar>
        </Box>

        <Drawer
          anchor="left"
          open={isDrawerOpen}
          onClose={() => toggleDrawer(false)}
        >
          <Box width={250}>
            <Box width={250} sx={{ borderBottom: 1 }}>
              <Typography
                variant="h6"
                align="center"
                style={{ padding: "16px" }}
              >
                List of Drawings
              </Typography>
            </Box>
            <List>
              {drawings.map((drawing) => (
                <ListItem
                  key={drawing.id}
                  component="li" 
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleClickItem(drawing)}
                >
                  <ListItemText primary={drawing.name} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbars
              setFile={setFile}
              canvas={canvas}
              setIsPanning={setIsPanning}
              isPannings={isPannings}
              setDrawingMode={setDrawingMode}
              drawingMode={drawingMode}
              setPolygonPoints={setPolygonPoints}
              setStartPoint={setStartPoint}
              strokeWidth={strokeWidth}
              handleStrokeWidthChange={handleStrokeWidthChange}
              fontSize={fontSize}
              handleFontSizeChange={handleFontSizeChange}
              textColor={textColor}
              handleTextColorChange={handleTextColorChange}
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              textInput={textInput}
              setTextInput={setTextInput}
              handleAddText={handleAddText}
              handleDownloadDXF={handleDownloadDXF}
              scale={scale}
              handleFileUpload={handleFileUpload}
            />
          </AppBar>
        </Box>
        <Button onClick={handleDownloadDXF} title="Download" />
      </div>
      <div>
        <canvas id="canvas" ref={canvasRef} width={1920} height={800} />
      </div>
    </>
  );
};

export default DXFViewer;
