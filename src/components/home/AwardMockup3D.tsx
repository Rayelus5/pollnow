import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF, Float, Lightformer, Text, Html, ContactShadows, Environment, MeshTransmissionMaterial } from "@react-three/drei"
import { Bloom, EffectComposer, N8AO, TiltShift2 } from "@react-three/postprocessing"
import { suspend } from "suspend-react"
import { easing } from "maath"

const inter = import("@pmndrs/assets/fonts/inter_regular.woff")
useGLTF.preload("/bomb-gp.glb")

export const AwardMockup3D = () => (
    <>
        <Canvas eventPrefix="client" shadows camera={{ position: [0, 0, 20], fov: 120 }}>
            <color attach="background" args={["#090A0F"]} />
            <spotLight position={[20, 20, 10]} penumbra={1} castShadow angle={0.2} />
                <Status position={[0, 0, 15]} />
            <Float floatIntensity={2}>

                    <Torus3 />
                    <Torus />
                    <Torus2 />
                    {/* <Bomb scale={0.7} /> */}
            </Float>
            <ContactShadows scale={100} position={[0, -7.5, 0]} blur={1} far={100} opacity={0.2} />
            <Environment preset="city">
                <Lightformer intensity={9.8} position={[12, 5, 0]} scale={[10, 40, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
            </Environment>
            <EffectComposer>
                <N8AO aoRadius={1} intensity={2} />
                <Bloom mipmapBlur luminanceThreshold={8} intensity={2} levels={8} />
                <TiltShift2 blur={0.5} />
            </EffectComposer>
            <Rig />
        </Canvas>
    </>
)

function Rig() {
    useFrame((state, delta) => {
        easing.damp3(
            state.camera.position,
            [Math.sin(-state.pointer.x) * 5, state.pointer.y * 3.5, 15 + Math.cos(state.pointer.x) * 10],
            0.2,
            delta,
        )
        state.camera.lookAt(0, 0, 0)
    })
}

// const Drop = (props) => (
//     <mesh>
//         <sphereGeometry args={[1, 64, 64]} />
//         <MeshTransmissionMaterial backside backsideThickness={5} thickness={2} />
//     </mesh>
// )

const Torus = (props) => (
    <mesh receiveShadow castShadow {...props}>
        <torusGeometry args={[40, 3, 12, 64]} />
        <MeshTransmissionMaterial color={"#47B5FF"} backside backsideThickness={12} thickness={2} />
    </mesh>
)


const Torus2 = (props) => (
    <mesh receiveShadow castShadow {...props}>
        <torusGeometry args={[100, 3, 12, 64]} />
        <MeshTransmissionMaterial color={"#4775FF"} backside backsideThickness={12} thickness={2} />
    </mesh>
)

const Torus3 = (props) => (
    <mesh receiveShadow castShadow {...props}>
        <torusGeometry args={[15, 3, 12, 64]} />
        <MeshTransmissionMaterial color={"#A6D3FF"} backside backsideThickness={12} thickness={2} />
    </mesh>
)

// const Knot = (props) => (
//     <mesh receiveShadow castShadow {...props}>
//         <torusKnotGeometry args={[10, 2, 256, 40]} />
//         <MeshTransmissionMaterial color={"green"} backside backsideThickness={12} thickness={2} />
//     </mesh>
// )

// function Bomb(props) {
//     const { nodes } = useGLTF("/bomb-gp.glb")
//     return (
//         <mesh receiveShadow castShadow geometry={nodes.Little_Boy_Little_Boy_Material_0.geometry} {...props}>
//             <MeshTransmissionMaterial backside backsideThickness={10} thickness={5} />
//         </mesh>
//     )
// }

function Status(props) {
    const text = "/pollnow"
    return (
        <Text fontSize={14} letterSpacing={-0.025} font={suspend(inter).default} color="white" {...props}>
            {text}
            <Html style={{ color: "transparent", fontSize: "33.5em" }} transform>
                {text}
            </Html>
        </Text>
    )
}