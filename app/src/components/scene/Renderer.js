import { WebGLRenderer, BasicShadowMap } from "three";

// see https://github.com/posva/state-animation-demos/tree/master/components/three

export default {
    props: {
        width: Number,
        height: Number
    },

    provide() {
        this.renderer = new WebGLRenderer();
        /*this.renderer.shadowMap.enabled = true
            this.renderer.shadowMap.type = BasicShadowMap*/

        return {
            renderer: this
        };
    },

    mounted() {
        this.renderer.setSize(400, 400);
            /*document.getElementById("scene").offsetWidth, 
            document.getElementById("scene").offsetHeight);*/
        this.animate();
    },

    methods: {
        animate() {
            if (this.scene && this.camera) {
                // this.camera.updateControls();
                this.renderer.render(this.scene, this.camera);
            } else {
                // console.warn('You need a scene and a camera inside of the renderer')
            }
            requestAnimationFrame(this.animate.bind(this));
        }
    },

    render(h) {
        this.$nextTick().then(() => {
            this.$el.appendChild(this.renderer.domElement);
        });
        return h("div", this.$slots.default);
    }
};
