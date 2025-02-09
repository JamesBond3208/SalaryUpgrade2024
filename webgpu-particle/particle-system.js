// 使用Three.js+WebGPU实现粒子爆破效果
import * as THREE from 'three';
import { WebGPURenderer } from 'three/addons/renderers/webgpu/WebGPURenderer.js';

class ParticleStorm {
  constructor() {
    this.initGPUContext();
    this.createComputePipeline();
    this.setupParticleBuffer();
  }

  initGPUContext = async () => {
    this.renderer = new WebGPURenderer();
    this.gpuDevice = await navigator.gpu.requestAdapter();
    this.computeQueue = this.gpuDevice.createCommandQueue();
  };

  createComputePipeline = () => {
    const computeShader = `
      [[stage(compute), workgroup_size(64)]]
      fn main([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
        // GPU并行计算粒子运动轨迹
        let index = global_id.x;
        particles.position[index] += vec3<f32>(
          noise(index, time),
          sin(time * 0.1),
          cos(time * 0.1)
        );
      }
    `;
    this.computePipeline = this.gpuDevice.createComputePipeline({
      compute: {
        module: this.gpuDevice.createShaderModule({ code: computeShader }),
        entryPoint: 'main'
      }
    });
  };

  setupParticleBuffer = () => {
    // 初始化10万粒子系统
    this.particleBuffer = this.gpuDevice.createBuffer({
      size: 100000 * 3 * 4, // x,y,z * float32
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
  };

  animate = () => {
    requestAnimationFrame(this.animate);
    
    const commandEncoder = this.gpuDevice.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.computePipeline);
    computePass.dispatch(100000 / 64);
    computePass.endPass();
    
    this.computeQueue.submit([commandEncoder.finish()]);
    this.renderer.render(this.scene, this.camera);
  };
}