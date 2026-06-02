# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_15.41.10_920463"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_15.41.10_920463/docugit-darwin-arm64"
      sha256 "da4269b66f20620de362e578e2c4bdb5463cf095477cdc2fe2c5d64b4d859508"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_15.41.10_920463/docugit-darwin-amd64"
      sha256 "a427d46254efc4755393e73f21c1f0828c78dfbcf8479c046d73abbe707fe80b"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_15.41.10_920463/docugit-linux-arm64"
      sha256 "6386f9dfa4f3963e68042e769203a78863e22e2db347dab0172a2ba23fb2d198"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_15.41.10_920463/docugit-linux-amd64"
      sha256 "9da2ae14b42db4aa89672c1d7ad90a73bef51f61adb25eb96be7b8561dac8015"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
