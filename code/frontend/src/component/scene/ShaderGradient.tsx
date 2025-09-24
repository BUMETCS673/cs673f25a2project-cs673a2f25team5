"use client";
import { GradientMeshProps, GradientT } from "@/lib/types";
import { presets } from "@/lib/presets";
import { Mesh } from "./Mesh";
import { Lights } from "./Lights";
import { PostProcessing } from "./PostProcessing";
import { Controls } from "./Controls";
import queryString from "query-string";
import { formatUrlString } from "@/lib/utils";
import { Axis } from "./Axis";

export function ShaderGradient(passedProps: GradientT) {
  const { control, urlString, onCameraUpdate, ...rest } = {
    ...presets.halo.props,
    ...passedProps,
  };

  let props: GradientMeshProps = rest;
  if (control === "query")
    props = queryString.parse(formatUrlString(urlString), {
      parseNumbers: true,
      parseBooleans: true,
      arrayFormat: "index",
    }) as unknown as GradientMeshProps;

  const { lightType, envPreset, brightness, grain, toggleAxis } = props;

  return (
    <>
      <Mesh {...props} />
      <Lights
        lightType={lightType}
        brightness={brightness}
        envPreset={envPreset}
      />
      {grain !== "off" && <PostProcessing />}

      {toggleAxis && <Axis />}
      <Controls onCameraUpdate={onCameraUpdate} />
    </>
  );
}
